(() => {
  'use strict';

  const tour = document.querySelector('[data-tour="studio-one-bedroom"]');
  if (!tour) return;

  const film = tour.querySelector('#tour-video');
  const buttons = [...tour.querySelectorAll('[data-room]')];
  const rooms = buttons.map(button => ({
    id: button.dataset.room,
    label: button.dataset.label,
    start: Number(button.dataset.start),
    button
  }));
  const clock = tour.querySelector('#tour-clock');
  const scene = tour.querySelector('#tour-scene');
  const marker = tour.querySelector('#tour-camera');
  const share = tour.querySelector('#tour-share');
  const feedback = tour.querySelector('#tour-feedback');
  const manual = tour.querySelector('#tour-manual');
  const linkField = tour.querySelector('#tour-link');
  const whatsapp = tour.querySelector('#tour-whatsapp');
  const duration = 13;
  const fps = 24;
  const lastFrame = duration - 1 / fps;
  let pendingTime = null;
  let activeRoom = null;
  let frameHandle = null;

  // These are the camera and look-at coordinates of the rendered film, in plan space.
  const positions = [[.6, 3.65], [.3, 1.2], [-.25, -.15], [-.65, -1.2], [.4, -2.25], [1.4, -2.25], [2.2, -2.25], [3, -2.45]];
  const targets = [[-2, -2.1], [-2, -2.6], [-2.05, -3.5], [-.91, -4], [1.7, -3.05], [3.65, -3.22], [4.29, -3.51], [4.22, -3.8]];

  function cameraCoordinate(points, segment, fraction, axis) {
    const a = points[Math.max(0, segment - 1)][axis];
    const b = points[segment][axis];
    const c = points[segment + 1][axis];
    const d = points[Math.min(points.length - 1, segment + 2)][axis];
    // Catmull-Rom interpolation matches the studio renderer.
    return .5 * (2*b + (c-a)*fraction + (2*a-5*b+4*c-d)*fraction**2 + (-a+3*b-3*c+d)*fraction**3);
  }

  function trackCamera(time) {
    const progress = Math.max(0, Math.min(time / lastFrame, 1));
    const distance = (positions.length - 1) * progress**2 * (3 - 2*progress);
    const segment = Math.min(positions.length - 2, Math.floor(distance));
    const fraction = distance - segment;
    const x = cameraCoordinate(positions, segment, fraction, 0);
    const y = cameraCoordinate(positions, segment, fraction, 1);
    const aimX = cameraCoordinate(targets, segment, fraction, 0);
    const aimY = cameraCoordinate(targets, segment, fraction, 1);
    const rotation = Math.atan2(aimX - x, y - aimY) * 180 / Math.PI;
    marker.setAttribute('transform', 'translate(' + (210 + 32*x) + ' ' + (196 + 32*y) + ') rotate(' + rotation + ')');
  }

  function roomAt(time) {
    return rooms.findLast(room => time >= room.start) || rooms[0];
  }

  function displayAt(time) {
    const current = roomAt(time);
    if (activeRoom !== current) {
      for (const room of rooms) {
        if (room === current) room.button.setAttribute('aria-current', 'true');
        else room.button.removeAttribute('aria-current');
      }
      scene.textContent = current.label;
      activeRoom = current;
    }
    clock.textContent = '00:' + String(Math.floor(time)).padStart(2, '0') + ' / 00:13';
    trackCamera(time);
  }

  function actualTime() {
    return pendingTime ?? film.currentTime;
  }

  function updateFromFilm() {
    displayAt(actualTime());
  }

  function startTracking() {
    if (!film.requestVideoFrameCallback || frameHandle !== null) return;
    function onFrame(_, frame) {
      frameHandle = null;
      if (film.paused || film.ended) return;
      displayAt(pendingTime ?? frame.mediaTime);
      frameHandle = film.requestVideoFrameCallback(onFrame);
    }
    frameHandle = film.requestVideoFrameCallback(onFrame);
  }

  function stopTracking() {
    if (frameHandle !== null) {
      film.cancelVideoFrameCallback(frameHandle);
      frameHandle = null;
    }
    updateFromFilm();
  }

  function applyPendingSeek() {
    if (pendingTime === null || film.readyState < 1) return;
    const requestedTime = pendingTime;
    try {
      film.currentTime = Math.min(requestedTime, Number.isFinite(film.duration) ? film.duration : duration);
      pendingTime = null;
    } catch {
      // Some mobile players accept the seek only after the first frame has loaded.
    }
  }

  function selectRoom(time, play) {
    pendingTime = time;
    feedback.textContent = '';
    manual.hidden = true;
    whatsapp.hidden = true;
    displayAt(time);
    applyPendingSeek();
    if (play) {
      film.play().catch(() => {
        feedback.textContent = 'Press play to watch from this room.';
      });
    }
  }

  function restoreSharedMoment() {
    const query = new URLSearchParams(location.search);
    const room = rooms.find(item => item.id === query.get('room'));
    if (!room) return;
    const value = query.get('t');
    const time = value === null || value.trim() === '' ? room.start : Number(value);
    const sharedTime = Number.isFinite(time) && time >= room.start && time <= duration && roomAt(time) === room
      ? Math.min(lastFrame, time) : room.start;
    selectRoom(sharedTime, false);
  }

  function selectedLink() {
    // Build from a clean URL so no private-preview credentials or tracking parameters travel with the share.
    const url = new URL(location.href);
    const time = Math.floor(Math.min(lastFrame, actualTime()) * 100) / 100;
    const room = roomAt(time);
    url.search = '';
    url.hash = 'screening';
    url.searchParams.set('room', room.id);
    url.searchParams.set('t', String(time));
    return {url: url.toString(), title: 'Viewz · One-bedroom studio concept', text: 'See the ' + room.label.toLowerCase() + ' in the walkthrough.'};
  }

  async function copyLink() {
    film.pause();
    const {url} = selectedLink();
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        manual.hidden = true;
        feedback.textContent = 'Moment link copied.';
        return;
      } catch {
        // A blocked clipboard still leaves a selectable URL.
      }
    }
    manual.hidden = false;
    linkField.value = url;
    linkField.focus();
    linkField.select();
    feedback.textContent = 'Select and copy the link below.';
  }

  async function shareMoment() {
    film.pause();
    const data = selectedLink();
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(data);
        return;
      } catch (error) {
        if (error.name === 'AbortError') return;
      }
    }
    whatsapp.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(data.text + ' ' + data.url);
    whatsapp.hidden = false;
    feedback.textContent = 'Choose WhatsApp or copy the link.';
    whatsapp.focus();
  }

  for (const room of rooms) {
    room.button.addEventListener('click', () => {
      selectRoom(room.start, true);
      const frame = film.getBoundingClientRect();
      if (frame.bottom < innerHeight * .24 && matchMedia('(max-width: 760px)').matches) {
        film.scrollIntoView({block: 'start'});
      }
    });
  }
  for (const link of document.querySelectorAll('[data-play-feature]')) {
    link.addEventListener('click', () => selectRoom(0, true));
  }
  film.addEventListener('loadedmetadata', applyPendingSeek);
  film.addEventListener('loadeddata', applyPendingSeek);
  film.addEventListener('seeked', () => {
    if (pendingTime === null && film.readyState >= 2) film.removeAttribute('poster');
    updateFromFilm();
  });
  film.addEventListener('timeupdate', updateFromFilm);
  film.addEventListener('playing', startTracking);
  film.addEventListener('pause', stopTracking);
  film.addEventListener('ended', stopTracking);
  film.addEventListener('error', () => { feedback.textContent = 'The film could not load. Refresh the page to try again.'; });
  share.addEventListener('click', shareMoment);
  tour.querySelector('#tour-copy').addEventListener('click', copyLink);
  window.addEventListener('popstate', restoreSharedMoment);
  restoreSharedMoment();
  updateFromFilm();
})();
(() => {
  const root = document.querySelector('[data-case-study]');
  if (!root) return;
  const stage = root.querySelector('.case-stage');
  const film = root.querySelector('.case-film');
  const source = root.querySelector('.case-source');
  const hold = root.querySelector('[data-case-hold]');
  const label = root.querySelector('[data-case-label]');
  const play = root.querySelector('[data-case-play]');
  const status = root.querySelector('[data-case-status]');
  const modes = [...root.querySelectorAll('[data-case-mode]')];
  let mode = 'finish';
  let holding = false;
  let resume = false;
  let pointer = null;

  function paint() {
    const visible = holding ? (mode === 'source' ? 'finish' : 'source') : mode;
    const original = visible === 'source';
    source.hidden = !original;
    label.textContent = original ? 'Source model' : 'Finished design';
    root.querySelector('[data-hold-label]').textContent = mode === 'source' ? 'Hold for finish' : 'Hold for source';
    for (const button of modes) button.setAttribute('aria-pressed', String(mode === button.dataset.caseMode));
    hold.classList.toggle('is-held', holding);
  }
  function choose(next) {
    if (holding) release(false);
    mode = next;
    film.pause();
    if (film.readyState && film.currentTime) film.currentTime = 0;
    film.classList.remove('is-playing');
    paint();
    status.textContent = mode === 'source' ? 'Showing original route model.' : 'Showing finished design.';
  }
  function compare() {
    if (holding) return;
    resume = !film.paused;
    film.pause();
    holding = true;
    paint();
  }
  function release(continueFilm = true) {
    if (!holding) return;
    holding = false;
    pointer = null;
    paint();
    if (continueFilm && resume && mode === 'finish') startFilm();
    resume = false;
  }
  function playing(active) {
    play.setAttribute('aria-pressed', String(active));
    root.querySelector('[data-play-label]').textContent = active ? 'Pause shot' : (film.ended ? 'Replay shot' : 'Play shot');
  }
  function startFilm() {
    mode = 'finish';
    paint();
    if (film.ended) film.currentTime = 0;
    film.classList.add('is-playing');
    const result = film.play();
    if (result) result.catch(() => {
      film.classList.remove('is-playing');
      playing(false);
      status.textContent = 'The shot could not play. You can still compare the source and finish.';
    });
  }
  for (const button of modes) button.addEventListener('click', () => choose(button.dataset.caseMode));
  play.addEventListener('click', () => {
    if (!film.paused) film.pause();
    else startFilm();
  });
  hold.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = event.pointerId;
    hold.setPointerCapture(event.pointerId);
    compare();
  });
  function endPointer(event) {
    if (event.pointerId === pointer) release();
  }
  hold.addEventListener('pointerup', endPointer);
  hold.addEventListener('pointercancel', endPointer);
  hold.addEventListener('lostpointercapture', endPointer);
  hold.addEventListener('contextmenu', event => event.preventDefault());
  const isCompareKey = event => event.key === ' ' || event.key === 'Enter';
  hold.addEventListener('keydown', event => {
    if (isCompareKey(event) && !event.repeat) { event.preventDefault(); compare(); }
  });
  hold.addEventListener('keyup', event => {
    if (isCompareKey(event)) { event.preventDefault(); release(); }
  });
  hold.addEventListener('blur', () => release());
  film.addEventListener('play', () => playing(true));
  film.addEventListener('pause', () => playing(false));
  film.addEventListener('ended', () => playing(false));
  film.addEventListener('error', () => {
    film.classList.remove('is-playing');
    playing(false);
    status.textContent = 'Video unavailable. Both comparison stills are available.';
  });
  window.addEventListener('blur', () => { release(false); film.pause(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { release(false); film.pause(); }
  });
  stage.classList.add('is-enhanced');
  film.controls = false;
  hold.hidden = false;
  root.querySelector('[data-case-toolbar]').hidden = false;
  paint();
})();
