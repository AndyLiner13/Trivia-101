# Data as an Asset

Data as an Asset makes it easier to ingest and access a large amount of data. You can use this data to generate and populate your worlds with content for players as part of a live service model.

## Requirements

• For Web Asset ingestion, you need access to your team's Asset Library to upload the assets to the library.

## Uploading Assets to the backend

### Web Asset upload

**Note: We currently only accept JSON files.**

1. Go to [https://horizon.meta.com/creator/assets](https://horizon.meta.com/creator/assets)
2. Click Import, and select Text.
3. Upload the asset. We only allow JSONs for now. You can use any valid .json you have, or download and upload the attached gamedatanew.JSON file at the bottom of the page.
4. You can download, edit and do other things with the Asset file, but this UI is the just the same as the Web Asset Ingestion UI.

### Desktop asset upload

**Note: We currently only accept JSON files.**

1. Open the Desktop Editor for Horizon.
2. Click Add New, and select Text.
3. Upload the asset. We only allow JSONs for now. You can use any valid json you have, or download and upload the attached gamedatanew.json file at the bottom of the page.
4. You can download, edit and do other things with the Asset file, but this UI is the just the same as the Desktop Asset Ingestion UI.

## Using the asset in TypeScript

### Getting the reference to the asset in a component

1. Using a component, for example, your game manager, create a reference to a text asset.
2. Pick from your available assets.
3. Please note that your world will be referencing the Asset version at the moment of assigning. Updates to the Asset will not be reflected until you give a new reference to the asset. If you want your world to reference the latest version of the asset, use the method below of creating a new asset with ID reference.

### Creating a reference to the asset by providing the asset ID, optionally, asset version ID

1. Create a new Asset, with an Asset ID. You can obtain this by inspecting the asset in your Desktop Editor Asset Library interface, or the Web Asset Library interface.
2. You can optionally provide the Asset version ID when creating the Asset. You can find this Asset version ID in the Web Asset Library interface. Your world will reference that version of the asset even if the Asset is updated.
3. To reference the latest version of the Asset whenever it is updated, create a new Asset Object with the ID, but do not provide the optional version ID.
4. For example `let asset = new Asset(ASSET_ID_BIGINT_HERE);`
5. Please note that Asset loads are cached. If you are running the world, load the Asset and update it in the backend any new Asset loads will be the ones at time of asset load. You must restart the world to get your latest uploaded Asset version.

Once you retrieve the reference to the Asset object, you can fetch its data and use the following APIs to pull the asset as an object. Within the object, there are:
• `asJson()`. You can provide an expected type to ensure that the JSON returned is of the intended type.
• `asText()`.

### Example Code

This script verifies whether you are able to pull asset data as a string:

```typescript
import * as hz from 'horizon/core';

interface JSONData {
  qns_type: string;
  difficulty: string;
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

/* Here's an example of the JSON data that will be passed in:
[
  {
    "qns_type": "boolean",
    "difficulty": "medium",
    "category": "General Knowledge",
    "question": "Why did the chicken cross the road",
    "correct_answer": "False",
    "incorrect_answers": [
      "True"
    ]
  },
  {
    "qns_type": "boolean",
    "difficulty": "medium",
    "category": "General Knowledge",
    "question": "Why did the cow go moo.",
    "correct_answer": "True",
    "incorrect_answers": [
      "False"
    ]
  }
]
*/

class CheckAssetIntegrity extends hz.Component<typeof CheckAssetIntegrity> {

  static propsDefinition = {
    textAsset: { type: hz.PropTypes.Asset },
  };

  allQnsData: JSONData[] | null = null;

  // called on world start
  async start() {
    let asset = this.props.textAsset!;

    /*
    // create a new Asset and do not provide the version id
    // if you want to reference the latest version
    // of the Asset
    let asset = new Asset(ASSET_ID_BIGINT_HERE);
    */
    asset.fetchAsData().then((output: hz.AssetContentData) => {
      console.warn(asset.id + " \n" + asset.versionId);
      this.handleExtractAssetContentData(output);
    })
  }

  handleExtractAssetContentData(output: hz.AssetContentData) {
    var text = output.asText();
    console.log("Total text length: ", text.length);
    console.log("First 10 characters of the text for verification: ", text.substring(0, 10));
    console.log("==================================");
    var jsobj = output.asJSON();
    if (jsobj == null || jsobj == undefined) {
      console.error("null jsobj");
      return;
    }
    else {
      this.allQnsData = output.asJSON<JSONData[]>();
    }
  }
}

// This tells the UI that your component can be attached to an entity
hz.Component.register(CheckAssetIntegrity);
```

### Fetch asset options

The options parameter of the fetchAsData method provides the skipCache option, which skips the local cache when fetching asset data. To enable this option, set the skipCache option to true. This option is disable by default. Enabling skipCache is only useful if you expect the asset that you are referencing to change while the world instance is running, and you have already accessed the asset.

## Examples

• A sample JSON file (trivia.json) with trivia questions in a JSON format. (More questions can be accessed via trivia APIs, such as [Open Trivia DB](https://opentdb.com/api_config.php)).
• A Trivia world with a game manager script to load these questions from that JSON asset.
• A simple trigger script to allow for users to answer these trivia questions.
• You are able to load versions of Text Assets that were before the current version. This is helpful if you want to lock a version of the Asset to a particular world. You can do this by providing the actual values of the Asset IDs and the version IDs, like the code sample below.

```typescript
const assetId = BigInt(this.props.assetID); // use a string
const versionId = BigInt(this.props.assetVerID);  // use a string
asset = new hz.Asset(assetId, versionId);
```

## Notes

• Spawning a text asset does nothing.
• You cannot use this API to pull the data of a non-text asset. You will receive null data.
• You can only upload .JSONs files.
• Whenever you pull the data object, you are calling into the C# backend from the TS. This is performance intensive and should be done sparingly.
  • You may want to cache the .json object when you create it. The string is already cached when the object is created. If you are using it as a .JSON more than once, we recommend caching it once created.
  • Pull smaller .json files.
  • Pull when refreshing the world and during downtime.

## Performance

• Currently the Max asset file size is 8MB. The C# to TS bridge currently only accepts this much data in a single call, even though the asset library accepts files of up to 25MB.
  • Speed of upload to the Asset Library for a 1.8 MB file is ~5s.
  • Speed of download to TypeScript for a .json file of size 1.85MB in an empty world is ~2s
  • Speed of updates – How fast does it take to get the latest uploaded asset data?
   • It depends on your file size. We've seen 1KB files be updated almost immediately, while 5MB files may take up to 5 mins.
  • Do not use the skipCache option unless you are updating the asset while the world instance is live.