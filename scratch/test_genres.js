const ANILIST_URL = "https://graphql.anilist.co";

async function testGenreSupport(genres) {
  const query = `
    query ($genres: [String]) {
      Page(page: 1, perPage: 1) {
        media(genre_in: $genres, type: ANIME) {
          id
          title { english }
          genres
        }
      }
    }
  `;
  try {
    const res = await fetch(ANILIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables: { genres } }),
    });
    const json = await res.json();
    if (json.errors) {
      console.log(`Genres ${JSON.stringify(genres)}: ERROR:`, json.errors[0]?.message);
    } else {
      console.log(`Genres ${JSON.stringify(genres)}: SUCCESS. Found:`, json.data?.Page?.media?.[0]?.title?.english || 'none');
    }
  } catch (e) {
    console.error(e);
  }
}

async function run() {
  await testGenreSupport(["Action"]);
  await testGenreSupport(["Seinen"]);
  await testGenreSupport(["Shounen"]);
  await testGenreSupport(["Boys Love"]);
  await testGenreSupport(["Girls Love"]);
  await testGenreSupport(["Slice of Life"]);
  await testGenreSupport(["Mahou Shoujo"]);
  await testGenreSupport(["Cyberpunk"]);
}

run();
