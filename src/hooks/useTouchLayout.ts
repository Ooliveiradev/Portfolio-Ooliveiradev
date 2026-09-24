import { useEffect, useState } from 'react';
import { TOUCH_LAYOUT_QUERY, usesTouchLayout } from '../utils/mobileExperience';

export function useTouchLayout() {
  const [touch, setTouch] = useState(usesTouchLayout);
  useEffect(() => {
    const media = window.matchMedia(TOUCH_LAYOUT_QUERY);
    const update = () => setTouch(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  return touch;
}
