# QuizMonster

Five-round image comparison quizzes, with eight existing presets and a curated collection of 80 image entries (five per category). The dark layout, preset share URLs and custom pairings remain.

## Image correctness and credits

The game now uses checked, locally hosted images instead of labeling arbitrary Wikimedia text-search matches as correct answers. Named artworks and monuments have linked subject references. Fashion captions explicitly date clothing to the stated decade; elephant files have explicit species descriptions. Some monuments contain mixed styles or predate the empire associated with them, so labels and the on-page curation notes state those limits.

Creator, license, Commons source and subject/date reference are available in each round, answer history, `credits.html` and [IMAGE-CREDITS.md](IMAGE-CREDITS.md). Display copies are resized to at most 800 pixels, converted to JPEG and stripped of embedded metadata; their individual source licenses still apply. The game does not claim ownership of the images.

## Custom mode

Custom mode accepts the 16 listed categories (including old preset query aliases), paired within the same subject group. Arbitrary free-text image searches are no longer scored because search ranking cannot establish a correct category. Overlapping or identical sets are rejected. The small catalogue means repeated games reuse examples.

## Running and behavior

Serve this directory as a static website. There are no runtime API, account, backend, logging or storage dependencies. All gameplay images are local. Per-image loading has a timeout; failed images return a clear retry message and are never scored. Canceling loading invalidates the pending game. Answers require a separate Next Round action, and locked buttons prevent duplicate scoring. Image choice buttons support keyboard input.

Test coverage includes all presets, correct/wrong scoring, rapid duplicate actions, reset, custom validation, legacy URLs, image failure/timeout, cancellation, safe metadata rendering, complete attribution records, offline gameplay and mobile overflow.
