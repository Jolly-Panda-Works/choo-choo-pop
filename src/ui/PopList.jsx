import { useEffect, useRef, useState } from 'react';

/** Scrolling list of a popup: its top and bottom edges fade softly while there is more to scroll that way. */
export default function PopList({ style, children }) {
  const ref = useRef();
  const [edges, setEdges] = useState('');
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const top = el.scrollTop > 2 ? ' fade-top' : '';
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2 ? ' fade-bottom' : '';
    setEdges(top + bottom);
  };
  useEffect(measure);
  return (
    <div ref={ref} className={'pop-list' + edges} style={style} onScroll={measure}>
      {children}
    </div>
  );
}
