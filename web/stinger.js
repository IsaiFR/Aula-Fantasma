'use strict';

(() => {
  if (!window.stinger) return;
  const CUT_SECONDS = .9;
  let playback;

  function stop(current, ended = false) {
    if (playback !== current) return;
    playback = null;
    const { video, id, abort, frame } = current;
    abort.abort();
    if (frame !== undefined) video.cancelVideoFrameCallback(frame);
    video.pause();
    video.hidden = true;
    if (ended) window.stinger.signal(id, 'ended');
  }

  window.stinger.onPlay(({ id, format }) => {
    if (playback) stop(playback);
    const video = document.getElementById(format);
    const abort = new AbortController();
    const current = playback = { id, video, abort };
    const done = () => stop(current, true);
    video.addEventListener('ended', done, { signal: abort.signal, once: true });
    video.addEventListener('error', done, { signal: abort.signal, once: true });
    const advance = (_time, { mediaTime }) => {
      if (playback !== current) return;
      if (mediaTime >= CUT_SECONDS) window.stinger.signal(id, 'cut');
      else current.frame = video.requestVideoFrameCallback(advance);
    };
    video.currentTime = 0;
    video.hidden = false;
    current.frame = video.requestVideoFrameCallback(advance);
    video.play().catch(done);
  });

  window.stinger.onStop(id => { if (playback?.id === id) stop(playback); });
})();
