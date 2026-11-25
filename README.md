**Run:** [Production (master, GitHub Pages)](https://NimrodH.github.io/legoCollect) · Development: no separate deploy — run locally at http://localhost:8000/ (see [Run locally](#run-locally))

# legoCollect — collect or destroy created models

A browser experiment built with [Babylon.js](https://www.babylonjs.com/). Participants build
Lego-like models (a man and a dog) block by block, following step pictures. After each
completed stage they are offered a smaller reward and decide whether to build another stage
(YES) or stop (NO). Every action is logged to AWS DynamoDB.

## Experiment groups

| Group | Order of building | Completed models |
|-------|-------------------|------------------|
| A | whole man, then whole dog, same world | collected and kept |
| B | whole man, then whole dog, same world | destroyed block by block |
| C | switches between man and dog in chunks, two worlds | collected and kept |
| D | switches between man and dog in chunks, two worlds | destroyed block by block |

Rewards per stage are in `students.js` (`REPEATED_MODEL_REWARDS_AB`, `REPEATED_MODEL_REWARDS_CD`).

### Test user IDs

- `666` — no forced training; every model completes after 2 blocks.
- `test` / `999` — shows a preview of 10 completed copies of each model.

## Run locally

No build and no installs — static files only.

```powershell
python -m http.server 8000
```

Then open http://localhost:8000/. (Opening `index.html` directly also works in most cases,
but a local server is more reliable.)

> Local runs write to the real DynamoDB tables. Use the test user IDs above.

## Files

- `index.html` — page and scene setup
- `lego1.js` — blocks, models, worlds, API endpoints
- `students.js` — session, groups, stages, rewards, logging
- `messages.js` — on-screen flow and texts (Hebrew)
- `textures/` — step pictures and skyboxes
- `lego_users_index.mjs` — AWS Lambda source that writes to `lego_users` and `lego_user_results` (deployed separately in AWS)
- `update-model-names.sh` / `.js` — one-off DynamoDB maintenance scripts

Exported participant results go in `data/`, which is not committed.

## Publishing

`master` is served by GitHub Pages, so pushing to `master` updates the live experiment:

```powershell
git push origin master
```
