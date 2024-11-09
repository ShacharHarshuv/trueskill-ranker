import { signal } from "~/utils/signal";
import { persistentSignal } from "~/utils/persistant-signal";
import { onMount, createEffect, createComputed, createMemo } from "solid-js";
import { Rating, quality_1vs1, rate_1vs1 } from "ts-trueskill";
import {
  createItemsSignal,
  Item,
  serializeItems,
  parseItems,
} from "~/routes/items";

type Match = [Item, Item];

export default function Home() {
  const list = createItemsSignal(); // todo: need to come up with a custom parse and stringify for Item

  createEffect(() => {
    console.log(list());
  });

  onMount(() => {
    const rating1 = new Rating();
    const rating2 = new Rating();
    const quality = quality_1vs1(rating1, rating2);
    console.log("quality", quality);
  });

  function getQuality(item1: Item, item2: Item) {
    return (
      (item1.rating.sigma + item2.rating.sigma) /
      (1 + Math.abs(item1.rating.mu - item2.rating.mu))
    );
  }

  function pickMatch() {
    console.time("find best match");
    const listRandom = list()
      .slice()
      .sort(() => Math.random() - 0.5);

    let bestMatch: Match = [listRandom[0], listRandom[1]];
    let bestMatchesScore = -Infinity;

    for (let i = 0; i < listRandom.length; i++) {
      for (let j = i + 1; j < listRandom.length; j++) {
        const matchQuality = getQuality(listRandom[i], listRandom[j]);
        if (matchQuality > bestMatchesScore) {
          bestMatch = [listRandom[i], listRandom[j]];
          bestMatchesScore = matchQuality;
        }
      }
    }

    const randomMatchOrder: Match =
      Math.random() < 0.5 ? bestMatch : [bestMatch[1], bestMatch[0]];

    console.timeEnd("find best match");

    return randomMatchOrder;
  }

  const currentMatch = createMemo(() => {
    if (list().length < 2) {
      return null;
    }

    return pickMatch();
  });

  function pasteListFromClipboard() {
    if (list().length && !confirm("are you sure you want to clear the list?")) {
      return;
    }

    navigator.clipboard.readText().then((text) => {
      list.set(
        text.split("\n").map((name) => ({ name, rating: new Rating() })),
      );
    });
  }

  function recordWin(index: 0 | 1) {
    if (!currentMatch()) {
      return;
    }

    const winner = currentMatch()![index];
    const loser = currentMatch()![1 - index];

    const [newWinnerRating, newLoserRating] = rate_1vs1(
      winner.rating,
      loser.rating,
    );

    winner.rating = newWinnerRating;
    loser.rating = newLoserRating;

    list.set([...list()]);
  }

  const sortedList = createMemo(() => {
    return list().sort((a, b) => b.rating.mu - a.rating.mu);
  });

  const averageSigma = createMemo(() => {
    return (
      list().reduce((acc, item) => acc + item.rating.sigma, 0) / list().length
    );
  });

  createEffect(() => {
    console.log("averageSigma", averageSigma());
  });

  const initialSigma = new Rating().sigma;

  const confidenceScore = createMemo(() => {
    return (1 - averageSigma() / initialSigma) * 100;
  });

  function saveRankings() {
    const serializedList = serializeItems(list());
    // download file
    const blob = new Blob([serializedList], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rankings.json";
    a.click();
  }

  function loadRankings() {
    // choose file
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        list.set(parseItems(text));
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function removeItem(index: number) {
    return () => {
      if (
        !confirm(`are you sure you want to remove "${list()[index].name}"?`)
      ) {
        return;
      }

      list.set(list().filter((_, i) => i !== index));
    };
  }

  function addItem() {
    const name = prompt("Enter a name");
    if (!name) {
      return;
    }

    list.set([
      ...list(),
      {
        name,
        rating: new Rating(),
      },
    ]);
  }

  return (
    <main>
      <h1>Trueskill Ranker</h1>
      <h2>What is it?</h2>
      <p>
        <i>Trueskill ranker</i> is an open-source web app that uses the{" "}
        <a href="https://en.wikipedia.org/wiki/TrueSkill">
          truskill ranking system
        </a>{" "}
        to help you sort a list of items, by comparing them <b>two at a time</b>
        . This is an improvement on{" "}
        <a href="https://elo-ranker.glitch.me/">elo ranker</a> since it
        prioritizes comparison of items with similar ratings and low
        "confidence", which effectively means you can get an{" "}
        <b>accurate rating much faster</b>. It also allows you to add a new item
        to an already ranked list, and will quickly find its place.
      </p>
      <p>
        You can use it to rank your favorite movies, songs, books, TV shows or
        even prioritize your tasks or startup ideas!
      </p>
      <h2>How to use it?</h2>
      <p>
        To start, you can add items either using the "Add" button one at a time,
        or "Paste List from Clipboard" to add multiple items at once by copying
        a list where each item is on a separate line (Note! this function will
        erase your existing list). After adding at least two items you can start
        rating them by picking your favorite out of two at a time!
      </p>
      <p>
        When you are done, you can save your rankings to a .json file, and later
        load them in another computer or browser.
      </p>
      <h2>Sweet! Can I help?</h2>
      <p>
        Sure! Head over the{" "}
        <a href="https://github.com/ShacharHarshuv/trueskill-ranker">
          github page
        </a>{" "}
        to view the source code and create a pull request! New features are
        welcome.
      </p>
      {currentMatch() && (
        <div class="w-full flex gap-3 text-2xl items-center justify-center py-5">
          <button
            class="border bg-gray-100 hover:bg-gray-200 px-7 py-4 flex-1"
            onClick={() => recordWin(0)}
          >
            {currentMatch()![0].name}
          </button>
          or
          <button
            class="border bg-gray-100 hover:bg-gray-200 px-7 py-4 flex-1"
            onClick={() => recordWin(1)}
          >
            {currentMatch()![1].name}
          </button>
        </div>
      )}
      {currentMatch() && (
        <div
          class="border bg-gray-100 text-center relative"
          title={confidenceScore().toFixed(2) + "%"}
        >
          <span class="absolute">{confidenceScore().toFixed(2) + "%"}</span>
          <div
            class="bg-green-600 h-5"
            style={{ width: confidenceScore() + "%" }}
          ></div>
        </div>
      )}
      <div class="py-4 flex gap-3">
        <button
          onClick={addItem}
          class="px-3 py-1 border bg-blue-400 hover:bg-blue-500 text-white"
        >
          Add
        </button>
        <button
          onClick={pasteListFromClipboard}
          class="px-3 py-1 border bg-gray-100 hover:bg-gray-200"
        >
          Paste List from Clipboard
        </button>
        <button
          class="px-3 py-1 border bg-gray-100 hover:bg-gray-200"
          onClick={saveRankings}
        >
          Save Rankings
        </button>
        <button
          class="px-3 py-1 border bg-gray-100 hover:bg-gray-200"
          onClick={loadRankings}
        >
          Load Rankings
        </button>
      </div>
      <table>
        {sortedList().map((item, index) => (
          <tr>
            <td>{index + 1}.</td>
            <td>{item.name}</td>
            <td class="px-2">
              <button
                class="text-red-500"
                onClick={removeItem(index)}
                title={`Remove "${item.name.trim()}"`}
              >
                X
              </button>
            </td>
            <td class="px-4">mu={item.rating.mu.toFixed(2)}</td>
            <td class="px-4">sigma={item.rating.sigma.toFixed(2)}</td>
            <td class="px-4">
              {(
                (100 * (sortedList().length - index)) /
                sortedList().length
              ).toFixed(0)}
            </td>
          </tr>
        ))}
      </table>
    </main>
  );
}
