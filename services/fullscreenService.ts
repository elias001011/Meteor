const getDocument = () => document as Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

const getElement = (element: Element) => element as Element & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

export const isFullscreenActive = () => {
  const doc = getDocument();
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
};

export const isFullscreenSupported = () => {
  const doc = getDocument();
  return Boolean(
    doc.fullscreenEnabled ||
    typeof getElement(document.documentElement).webkitRequestFullscreen === 'function'
  );
};

export const requestFullscreen = async (element: Element = document.documentElement): Promise<boolean> => {
  const target = getElement(element);
  const request = target.requestFullscreen?.bind(target) ?? target.webkitRequestFullscreen?.bind(target);

  if (!request) return false;

  try {
    await Promise.resolve(request());
    return true;
  } catch {
    return false;
  }
};

export const exitFullscreen = async (): Promise<boolean> => {
  const doc = getDocument();
  const exit = doc.exitFullscreen?.bind(doc) ?? doc.webkitExitFullscreen?.bind(doc);

  if (!exit) return false;

  try {
    await Promise.resolve(exit());
    return true;
  } catch {
    return false;
  }
};

export const toggleFullscreen = async (element: Element = document.documentElement): Promise<boolean> => {
  if (isFullscreenActive()) {
    return exitFullscreen();
  }

  return requestFullscreen(element);
};
