# Cloudsea Dragon · تنين بحر الغيم

A one-touch browser game: hold to dive into a sea of clouds, release to leap, and eat lanterns to keep your dragon's flame alive.

Play: https://qtur.github.io/cloudsea-dragon/

## Build
```
node tools/build.js      # dist/artifact, dist/yt (+ YouTube zip), dist/pages
node tools/covers.js     # cover images from an in-game scene (needs dist/yt)
```

## Test
```
node test/e2e.js dist/yt     # full playthrough against a mock YouTube Playables SDK
node test/sim.js 14400 no 0.4   # progression simulation
```
