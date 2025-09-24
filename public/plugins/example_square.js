(function(){
  if (!window.Plotterlab || typeof window.Plotterlab.registerGenerator !== 'function') return;
  const gen = {
    name: 'Example: Square Frame',
    params: { margin: 20, simplifyTol: 0, inset: 0 },
    fn: ({ width, height, margin, inset = 0 }) => {
      const x0 = margin + inset, y0 = margin + inset;
      const x1 = width - margin - inset, y1 = height - margin - inset;
      const p = [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]];
      return [p];
    }
  };
  window.Plotterlab.registerGenerator('exampleSquareFrame', gen);
})();
