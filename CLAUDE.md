# CLAUDE.md — legoCollect

A Babylon.js research experiment: participants build Lego-like models (man, dog, car, chair)
block by block, are offered a decreasing reward per completed stage, and choose to continue
(YES) or stop (NO). Every action is logged to AWS DynamoDB through API Gateway + Lambda.
Groups A/C collect completed models; groups B/D see them destroyed (Sisyphus condition).

## Repository and deploy

- GitHub: `NimrodH/legoCollect`, default branch **`master`**.
- **`master` is live**: GitHub Pages serves it at https://NimrodH.github.io/legoCollect —
  every push to `master` changes the running experiment for participants.
- No development deploy. Test locally (see below) before pushing.

## Git workflow (local project)

- Work directly on `master` in this folder. Start of session: `git status`, `git fetch`,
  `git pull --ff-only` if clean and behind.
- Commit in small, described commits. **Push only after the user says yes.** Never force-push.
- Do not commit `data/` (exported participant results — personal research data; already in
  `.gitignore`) or the consent-form `.docx`.

## Running locally

No build step, no npm packages — plain static files plus CDN scripts.

- Claude preview: `.claude/launch.json` config `lego-local` (`python -m http.server 8000`).
- Or by hand: `python -m http.server 8000`, then open http://localhost:8000/
- Local runs still write to the **real** DynamoDB tables (the API URLs are hard-coded).
  Use the test user IDs below so test rows are easy to tell apart.

Test user IDs (typed on the first screen):
- `666` — training not enforced, each model completes after 2 blocks (fast flow check).
- `test` or `999` — shows a preview of 10 already-completed copies of each model.

## Code map

- `index.html` — page, Babylon.js CDN scripts, scene/camera/light setup, `getData`/`postData`.
- `lego1.js` — blocks, models, connections, worlds/skyboxes (`setWorld`), API URLs
  (`tableURL`, `usersURL`), `enforceTraining`.
- `students.js` — session logic: groups A–D (and legacy E/H), stage sequences, reward
  tables `REPEATED_MODEL_REWARDS_AB` / `_CD`, saving actions (`saveUserAction`) and the
  NO decision (`saveNoDecision`).
- `messages.js` — on-screen flow and texts (Hebrew), group/ID input, reward screens.
- `textures/` — step pictures (`man1.JPG`…`dog11.JPG`, etc.) and skybox images.
- `lego_users_index.mjs` — source of the AWS Lambda (Node, SDK v3) that writes to
  `lego_users` and `lego_user_results`. **Editing it here does not deploy it**; it must be
  pasted/deployed in the AWS Lambda console. `lego_users_data.mjs` is the older version.
- `update-model-names.sh` / `.js` — one-off DynamoDB maintenance scripts (Sman→man, Scat→dog).
- `lego_‏‏index.html`, `‏‏red.*`, `textures/man6-11  old/` — old copies; not used by the app.

## Conventions

- Plain browser JavaScript with globals, loaded by `<script>` tags in order:
  `lego1.js`, `students.js`, `messages.js`. Keep that order.
- User-visible texts are in Hebrew; code comments are in English.
- Keep field names sent to the Lambda (`actionId`, `ActionType`, `ActionDetails`, `block`,
  `group`, `model`, `modelOrder`, `part`, `step`, `time`, `user`) unchanged — the Lambda
  and the exported data depend on them.
