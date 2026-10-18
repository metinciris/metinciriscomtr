# Podcast – Ahenk Cep browser TTS integration

## Scope

The React podcast page keeps its original Google Sheets data source, article order,
PubMed links and browser SpeechSynthesis fallback. Ahenk Cep is the default.
The UI shows a small loading bar while the ONNX model is fetched/initialized.
Synthesis and playback are serialized and cancellable from the listener's point
of view (stale audio is discarded). Worker failures and timeouts fall back to
the original browser voice for the selected title.

## Vendored code provenance

Unmodified browser runtime and trnorm Python files copied from:
https://github.com/ozguradmin/ahenk-turkish-tts
Upstream snapshot: commit `2319ffc7b12a2a70285f0ec32aac3eef5e8e36a5` (2026-10-18).
Copied from upstream `site/js/{worker,backend,config,engine,front,randn}.js`
and `site/py/` (front-end and trnorm).
`public/ahenk-cep/LICENSE` and `public/ahenk-cep/NOTICE` preserve
the original Apache-2.0 code licence, copyright and third-party attribution.
No model files are embedded in the website repository.

## Model and attributions

Ahenk Cep / Ahenk: https://github.com/ozguradmin/ahenk-turkish-tts
Ahenk Cep model card and weights: https://huggingface.co/ozgurguler/ahenk-cep-tr
Ahenk Cep model weights: Creative Commons Attribution 4.0 International (CC BY 4.0).
EMA Lightning base model: https://huggingface.co/canberkkkkkk/ema-lightning
(licence: Apache-2.0).
Training-data attribution preserved as required by the Ahenk model card:
- Alania Turkish Synthetic Speech by PatientDesk AI,
  https://huggingface.co/datasets/cloud0day3/alania-synthetic-speech-tr
  (CC BY 4.0)
- Alania Turkish Domain Text by PatientDesk AI,
  https://huggingface.co/datasets/cloud0day3/alania-domain-text-tr
  (CC BY 4.0)

The interface discloses that this is an AI-generated, designed synthetic voice.
Do not present it as a recording of a real person. No voice impersonation.
Credit the model and datasets when using it in third-party distributions.

## Deployment and runtime

- Model is fetched on demand from Hugging Face over HTTPS, once the user starts
  Ahenk playback; f16 ONNX files are checksum-verified and cached in Cache Storage.
- Code runs in a module Web Worker. Pyodide and onnxruntime-web are pinned in
  the upstream config.js (Pyodide 0.27.7; ONNX Runtime Web 1.30.0).
- WebAssembly is limited to one worker thread. This avoids any new
  Service Worker or cross-origin isolation, so the existing site's pages and
  third-party embeds are unaffected. Older phones can be slower.
- CSP additions in index.html and netlify.toml allow only the model/CDN
  origins required by the runtime; no API key is used.
- The old SpeechSynthesis is selectable and acts as a per-title fallback.
- Voice-only pronunciation adjustments are kept in
  `src/lib/ahenkPronunciation.ts`, not in the stored/displayed headlines.
  Currently supported: `H&E` → `Hematoksilen Eozin`,
  `p53` → `pe 53`, `Ewing` → `Yuing`, plus
  `p16`, `p40`, `p63` and `p57` → `pe` + their number.
  The list is deliberately short to preserve good existing pronunciations;
  add any further words only when users request them or after listening tests.
  See `src/lib/ahenkPronunciation.test.ts` for boundary tests.
- Use the original upstream URLs to check licences and updates. Reassess upstream
  changes, security and licence terms before refreshing vendored files.
