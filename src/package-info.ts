import { readFileSync } from 'fs';

interface PackageInfo {
  version: string;
}

const packageInfoJson = readFileSync('package.json', 'utf8');

const packageInfo = JSON.parse(packageInfoJson) as PackageInfo;

export default packageInfo;
