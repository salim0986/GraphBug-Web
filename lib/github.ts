import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

export async function getInstallationOctokit(installationId: string) {
  // This authenticates YOU as the APP, acting on that specific installation
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID,
      privateKey: process.env.NEXT_PUBLIC_GITHUB_PRIVATE_KEY,
      installationId: installationId,
    },
  });

  return octokit;
}