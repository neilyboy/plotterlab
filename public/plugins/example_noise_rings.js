(function(){
  if (!window.Plotterlab || typeof window.Plotterlab.registerGenerator !== 'function') return;
  function rand(seed){
    let s = (seed|0) || 1; return ()=> (s = (s*1664525 + 1013904223)>>>0)/4294967296;
  }
  const gen = {
    name: 'Example: Noise Rings',
    params: { rings: 24, steps: 360, amp: 3, margin: 20, simplifyTol: 0 },
    fn: ({ width, height, margin, rings, steps, amp, seed }) => {
      const cx = width/2, cy = height/2;
      const R0 = Math.min(width, height)/2 - margin;
      const out = [];
      const rnd = rand(seed);
      for (let k=0;k<rings;k++){
        const t = k/(Math.max(1,rings-1));
        const R = (0.15 + 0.85*t)*R0;
        const p = [];
        for (let i=0;i<=steps;i++){
          const a = (i/steps)*Math.PI*2;
          const rr = R + (rnd()-0.5)*amp;
          p.push([cx + rr*Math.cos(a), cy + rr*Math.sin(a)]);
        }
        out.push(p);
      }
      return out;
    }
  };
  window.Plotterlab.registerGenerator('exampleNoiseRings', gen);
})();
