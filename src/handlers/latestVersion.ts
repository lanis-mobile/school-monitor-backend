import gplay from "google-play-scraper";

const APP_ID = "io.github.alessioc42.sph";

export type availableVersionsResponse = {
  latestIOSVersion: string;
  izzyOnDroidVersion:
    | string
    | {
        versionName: string;
        versionCode: number;
      };
  playStoreVersion: string;
  github: {
    latestVersion: string;
    isPreRelease: boolean;
    body: string;
    createdAt: string;
    publishedAt: string;
  } | null;
  timestamp: Date;
};

let lastAvailableVersion: availableVersionsResponse = {
  latestIOSVersion: "unknown",
  izzyOnDroidVersion: "unknown",
  playStoreVersion: "unknown",
  github: null,
  timestamp: new Date(),
};

// cache the latest version for 10 minuites
export async function getLatestVersions() {
  const refreshRequired =
    new Date().getTime() - lastAvailableVersion.timestamp.getTime() >
      1000 * 60 * 10 || lastAvailableVersion.github === null;

  if (refreshRequired) {
    setTimeout(async () => {
      lastAvailableVersion = await fetchLatestVersions();
    }, 0);
  }
  return lastAvailableVersion;
}

async function fetchLatestVersions(): Promise<availableVersionsResponse> {
  // search does not work with APP_ID on iTunes for some reason
  const itunesResponse = await fetch(
    "https://itunes.apple.com/search?term=Lanis-Mobile&entity=software&country=de&limit=1",
  );
  const itunesVersion =
    (await itunesResponse.json()).results[0]?.version?.replace("v", "") ||
    "unknown";

  const izzyOnDroidResponse = await fetch(
    "https://apt.izzysoft.de/fdroid/api/v1/packages/" + APP_ID,
  );
  const izzyJson = await izzyOnDroidResponse.json();
  const izzyOnDroidVersion =
    izzyJson.packages[0] || izzyJson.suggestedVersionCode || "unknown";

  const playStoreResponse = await gplay.app({ appId: APP_ID });
  const playStoreVersion = playStoreResponse.version || "unknown";

  const githubResponse = await fetch(
    "https://api.github.com/repos/lanis-mobile/lanis/releases/latest",
  );
  const githubResponseJson = await githubResponse.json();
  return {
    latestIOSVersion: itunesVersion,
    izzyOnDroidVersion: izzyOnDroidVersion,
    playStoreVersion: playStoreVersion,
    github: {
      body: githubResponseJson.body,
      createdAt: githubResponseJson.created_at,
      latestVersion: githubResponseJson.tag_name,
      isPreRelease: githubResponseJson.prerelease,
      publishedAt: githubResponseJson.published_at,
    },
    timestamp: new Date(),
  };
}
