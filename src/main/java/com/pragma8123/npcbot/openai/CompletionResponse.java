package com.pragma8123.npcbot.openai;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class CompletionResponse extends OpenAiResponse {

    private String id;

    private String model;

    private List<CompletionChoice> choices;
}
