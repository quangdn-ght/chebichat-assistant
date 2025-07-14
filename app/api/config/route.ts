import { NextResponse } from "next/server";

import { getServerSideConfig } from "../../config/server";

const serverConfig = getServerSideConfig();

// Danger! Do not hard code any secret value here!
// 警告！不要在这里写入任何敏感信息！
// Filter custom models to only include those containing "qwen"
const filterQwenModels = (models: string) => {
  if (!models) return "";

  return models
    .split(",")
    .filter((model) => model.trim().toLowerCase().includes("qwen"))
    .join(",");
};

const DANGER_CONFIG = {
  needCode: serverConfig.needCode,
  hideUserApiKey: serverConfig.hideUserApiKey,
  disableGPT4: serverConfig.disableGPT4,
  hideBalanceQuery: serverConfig.hideBalanceQuery,
  disableFastLink: serverConfig.disableFastLink,
  customModels: filterQwenModels(serverConfig.customModels),
  defaultModel: serverConfig.defaultModel,
  visionModels: serverConfig.visionModels,
  authLogin: process.env.AUTH_LOGIN_URL || process.env.AUTHEN_PAGE || "/login",
};

declare global {
  type DangerConfig = typeof DANGER_CONFIG;
}

async function handle() {
  return NextResponse.json(DANGER_CONFIG);
}

export const GET = handle;
export const POST = handle;

export const runtime = "edge";
