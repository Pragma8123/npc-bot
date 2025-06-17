import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { auditTime, Observable, Subject } from 'rxjs';
import { CompletionChunk, ImageResponse } from './ai.types';
import { createInterface } from 'readline';
import { Readable } from 'stream';

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  async image(prompt: string): Promise<Buffer> {
    const { data } = await this.httpService.axiosRef.post<ImageResponse[]>(
      '/api/v1/images/generations',
      { prompt },
    );

    if (data[0].url) {
      const response = await this.httpService.axiosRef.get(data[0].url, {
        responseType: 'blob',
      });
      return Buffer.from(response.data);
    }

    throw new Error('Error generating image.');
  }

  completion(prompt: string): Observable<string> {
    let completionResponse = '';

    return new Observable<string>((subscriber) => {
      this.httpService.axiosRef
        .post(
          '/ollama/api/generate',
          {
            prompt,
            model: this.configService.get<string>('OPENWEBUI_API_MODEL'),
            system: this.configService.get<string>('OPENWEBUI_SYSTEM_PROMPT'),
          },
          {
            responseType: 'stream',
          },
        )
        .then((response) => {
          const rl = createInterface({
            input: response.data as Readable,
            crlfDelay: Infinity,
          });

          rl.on('line', (line) => {
            if (line.trim()) {
              try {
                const json = JSON.parse(line) as CompletionChunk;
                completionResponse += json.response;
                subscriber.next(completionResponse);
              } catch (e) {
                subscriber.error(e);
              }
            }
          });

          rl.on('close', () => {
            subscriber.complete();
          });
        })
        .catch((e) => {
          subscriber.error(e);
        });
    });
  }

  throttledCompletion(prompt: string, interval: number): Observable<string> {
    const update$ = new Subject<string>();

    this.completion(prompt).subscribe({
      next: (chunk) => update$.next(chunk),
      error: (error) => update$.error(error),
      complete: () => update$.complete(),
    });

    return update$.pipe(auditTime(interval));
  }
}
