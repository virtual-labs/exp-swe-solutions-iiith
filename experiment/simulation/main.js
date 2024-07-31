//////////////////////////////////////////////////Fixed End Moment for span AB////////////////////////////////////////////////////
function Visualize_INF() {
    // Get the input value
    const n = document.getElementById("w1").value;
  
    // Check if the input is a valid number
    if (!n || isNaN(n)) {
        alert("Please enter a valid number for n.");
        return;
    }
  
    
  if(n > 5){
    alert('Please enter value less than 6');
    return;
  }
  
    // Set the visibility of the graph text
    // document.getElementById("text4").style.visibility = "visible";
  
    const L = 1 // Width of the potential well
    const points = 100 ; // Number of points for the plot
    const xValues = [];
    const yValues = [];
    const nInt = parseInt(n);
  
    // Calculate psi(x) for different x
    for (let i = 0; i <= points; i++) {
        const x = (i / points) * L;
        const psi = Math.sqrt(2 / L) * Math.sin((nInt * Math.PI * x) / L);
        xValues.push(x.toFixed(2));
        yValues.push(psi.toFixed(2));
    }
  
    // Get the context of the canvas element we want to select
    const ctx = document.getElementById('myChart').getContext('2d');
  
    // Check if a chart instance already exists and destroy it
    if (window.myChart instanceof Chart) {
      window.myChart.destroy();
  }
  
    // Create a new chart instance
    window.myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: xValues,
          datasets: [{
              label: `ψ(x) for n=${nInt}`,
              data: yValues,
              borderColor: 'blue',
              backgroundColor: 'transparent',
              showLine: true,
              borderWidth: 2,
  
              pointRadius: 0
          }]
      },
      options: {
          plugins: {
              legend: {
                  display: false // hide legend
              },
              tooltip: {
                  enabled: false // disable tooltips
              }
          },
          scales: {
              x: {
                  grid: {
                      display: false // hide x-axis gridlines
                  },
                  ticks: {
                      display: false // hide x-axis data values
                  },
                  title: {
                      display: false,
                      text: 'x'
                  },
                  border: {
                    display: false
                  }
              },
              y: {
                  grid: {
                      display: false // hide y-axis gridlines
                  },
                  ticks: {
                      display: false // hide y-axis data values
                  },
                  title: {
                      display: false,
                      text: 'ψ(x)'
                  },
                  border: {
                    display: false
                  }
              }
          },
          responsive: true,
          maintainAspectRatio: false
      }
  });
    const topPercentage = nInt === 1 ? 100 : 100 - nInt * nInt * 3; // Adjust the multiplier as needed
    document.getElementById('myChart').style.top = `${topPercentage}%`;
    document.getElementById('nextButton1').style.visibility = "visible"; // Adjust the multiplier as needed
  
  }
  
  // Function to calculate potential energy array
  function U_sq(x, width, depth) {
    const u = new Array(x.length).fill(0);
    for (let i = 0; i < x.length; i++) {
        if (x[i] <= -width / 2 || x[i] >= width / 2) {
            u[i] = depth;
        }
    }
    return u;
  }
  
  function linspace(start, end, num) {
    const step = (end - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + step * i);
  }
  
  function brentq(func, a, b, theta0) {
    const tol = 1e-5;
    let fa = func(a, theta0);
    let fb = func(b, theta0);
  
    if (fa * fb > 0) {
        throw new Error('The function must have different signs at the interval endpoints.');
    }
  
    let c = a, fc = fa, d, e;
    let mflag = true;
  
    for (let iter = 0; iter < 100; iter++) {
        if (fa !== fc && fb !== fc) {
            c = (a * fb * fc) / ((fa - fb) * (fa - fc)) +
                (b * fa * fc) / ((fb - fa) * (fb - fc)) +
                (c * fa * fb) / ((fc - fa) * (fc - fb));
        } else {
            c = b - fb * (b - a) / (fb - fa);
        }
  
        if ((c < (3 * a + b) / 4 || c > b) ||
            (mflag && Math.abs(c - b) >= Math.abs(b - c) / 2) ||
            (!mflag && Math.abs(c - b) >= Math.abs(d - e) / 2)) {
            c = (a + b) / 2;
            mflag = true;
        } else {
            mflag = false;
        }
  
        fc = func(c, theta0);
        e = d;
        d = b - c;
  
        if (Math.abs(fc) < tol) {
            return c;
        }
  
        if (fa * fc < 0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }
  
        if (Math.abs(fa) < Math.abs(fb)) {
            [a, b] = [b, a];
            [fa, fb] = [fb, fa];
        }
    }
  
    throw new Error('Brent\'s method did not converge.');
  }
  
  function even_sol(x, theta0) {
    const y1 = Math.tan(x);
    const y = Math.sqrt((theta0 / x) ** 2 - 1);
    return y - y1;
  }
  
  function odd_sol(x, theta0) {
    const y2 = -1 / Math.tan(x);
    const y = Math.sqrt((theta0 / x) ** 2 - 1);
    return y - y2;
  }
  
  function sqWellSol(theta0, step) {
    const esol = [];
    const osol = [];
    const inc = linspace(step, theta0, Math.ceil(theta0 / step));
    let even = true;
  
    for (let i = 0; i < inc.length - 1; i++) {
        if (even && even_sol(inc[i], theta0) * even_sol(inc[i + 1], theta0) < 0) {
            esol.push(brentq(even_sol, inc[i], inc[i + 1], theta0));
            even = false;
        }
        if (!even && odd_sol(inc[i], theta0) * odd_sol(inc[i + 1], theta0) < 0) {
            osol.push(brentq(odd_sol, inc[i], inc[i + 1], theta0));
            even = true;
        }
    }
  
    return [esol, osol];
  }
  
  function even_wave(x, Vo, ek, ekap, L) {
    const A = Vo / 20;
    const B = A * (Math.cos(ek * L / 2)) / Math.exp(-ekap * L / 2);
    const wave = new Array(x.length).fill(0);
  
    for (let i = 0; i < x.length; i++) {
        if (x[i] <= -L / 2) {
            wave[i] = B * Math.exp(ekap * x[i]);
        } else if (x[i] >= L / 2) {
            wave[i] = B * Math.exp(-ekap * x[i]);
        } else {
            wave[i] = A * Math.cos(ek * x[i]);
        }
    }
    return wave;
  }
  
  function odd_wave(x, Vo, ok, okap, L) {
    const A = Vo / 20;
    const B = A * (Math.sin(ok * L / 2)) / Math.exp(-okap * L / 2);
    const wave = new Array(x.length).fill(0);
  
    for (let i = 0; i < x.length; i++) {
        if (x[i] <= -L / 2) {
            wave[i] = B * Math.exp(okap * x[i]);
        } else if (x[i] >= L / 2) {
            wave[i] = -B * Math.exp(-okap * x[i]);
        } else {
            wave[i] = -A * Math.sin(ok * x[i]);
        }
    }
    return wave;
  }
  
  function Visualize_FN() {
    // if (!VoElement || !w2Element) {
    //     console.error("Missing input elements.");
    //     return;
    // }
    const Vo = Math.min(parseInt(document.getElementById('potential').value), 8);
    const n = parseInt(document.getElementById('w2').value);
    const L = Math.max(10 - parseInt(document.getElementById('length').value), Math.ceil(n *1.5));
  
    
  
  
  
    const m = 0.067;
    const args = { width: L, depth: Vo };
    const x = linspace(-2 * L / 2, 2 * L / 2, 400);
    const U = U_sq(x, args.width, args.depth);
    const theta0 = Math.sqrt(m * 9.31e-31 * Vo * L * L / (2 * (6.58e-16) ** 2 * 1e18 * 1.6e-19));
    const [etheta, otheta] = sqWellSol(theta0, 0.1);
    const ek = etheta.map(e => e * 2 / L);
    const ok = otheta.map(o => o * 2 / L);
    const ekap = etheta.map(e => 2 * e / L * Math.tan(e));
    const okap = otheta.map(o => Math.abs(2 * o / L * Math.tan(o)));
    const e_eng = etheta.map(e => 2 * (1.05457173e-34) ** 2 * e ** 2 / (m * 9.31e-31 * (1.6e-19) * L * L * 1e-18));
    const o_eng = otheta.map(o => 2 * (1.05457173e-34) ** 2 * o ** 2 / (m * 9.31e-31 * (1.6e-19) * L * L * 1e-18));
  
  if(n > 5){
      alert('Please enter value less than 6');
      return;
  }
  
  if(L >= 10){
      alert('Please enter value less than 10');
      return;
  }
  
  if(Vo >= 10){
      alert('Please enter value less than 10');
      return;
  }
  
  const datasets = [];
  console.log("e_eng - ", e_eng);
  console.log("o_eng - ", o_eng);
  let evn = 0, not_evn = 0;
  if(n % 2 == 1){
    console.log("odd number");
    not_evn = Math.floor(n/2);
    evn = 0;
  }
  else{
    console.log("odd number");
  
    not_evn = 0;
    evn = Math.floor(n/2);
  }
  for (let i = not_evn;  n % 2 == 1 && i < not_evn+1; i++) {
      console.log("hi - ", i);
      const psi_even = even_wave(x, Vo, ek[i], ekap[i], L);
      const data = x.map((x_val, j) => ({x: x_val, y: psi_even[j] + e_eng[i]}));
      datasets.push({
          // label: `E=${e_eng[i].toFixed(2)} eV (Even)`,
          data: data,
          borderColor: 'blue',
          backgroundColor: 'transparent',
          showLine: true,
          borderWidth: 2,
  
          pointRadius: 0
      });
  }
  
  for (let i = evn-1;  n % 2 == 0 && i < evn; i++) {
      const psi_odd = odd_wave(x, Vo, ok[i], okap[i], L);
      const data = x.map((x_val, j) => ({x: x_val, y: psi_odd[j] + o_eng[i]}));
      datasets.push({
          // label: `E=${o_eng[i].toFixed(2)} eV (Odd)`,
          data: data,
          borderColor: 'blue',
          backgroundColor: 'transparent',
          borderWidth: 2,
          showLine: true,
          pointRadius: 0
      });
  }
  
  const data = {
      datasets: datasets
  };
  console.log('data: ', data);
  console.log('data: ', data.datasets[0].data);
  
  const ctx = document.getElementById('myChart2').getContext('2d');
  if (window.myChart instanceof Chart) {
      window.myChart.destroy();
  }
  
  window.myChart = new Chart(ctx, {
      type: 'scatter',
      data: data,
      label: false,
      options: {
        plugins: {
            legend: {
                display: false // hide legend
            },
            tooltip: {
                enabled: false // disable tooltips
            }
        },
        scales: {
            x: {
                grid: {
                    display: false // hide x-axis gridlines
                },
                ticks: {
                    display: false // hide x-axis data values
                },
                title: {
                    display: false,
                    text: 'x'
                },
                border: {
                  display: false
                }
            },
            y: {
                grid: {
                    display: false // hide y-axis gridlines
                },
                ticks: {
                    display: false // hide y-axis data values
                },
                title: {
                    display: false,
                    text: 'ψ(x)'
                },
                border: {
                  display: false
                }
            }
        },
        responsive: true,
        maintainAspectRatio: false
    }
  });
  
    const topPercentage = 35 - n * 3;
    document.getElementById('myChart2').style.top = `${topPercentage}%`;
  }
  
  // document.getElementById('visualizeButton').addEventListener('click', Visualize_FN);
  
  
  
  function restart() {
    location.reload();
  }
  
  function navNext0() {
    document.getElementById("canvas0").style.visibility = "hidden";
    document.getElementById("canvas1a").style.visibility = "hidden";
    document.getElementById("canvas1b").style.visibility = "hidden";
  
    document.getElementById("canvas1c").style.visibility = "hidden";
    document.getElementById("canvas1d").style.visibility = "hidden";
    document.getElementById("canvas1e").style.visibility = "hidden";
    document.getElementById("canvas1f").style.visibility = "hidden";
    document.getElementById('s1_1').style.visibility = "visible";
    document.getElementById("canvas1").style.visibility = "visible";
    document.getElementById("text4").style.visibility = "hidden";
    document.getElementById("text5").style.visibility = "hidden";
    document.getElementById("text6").style.visibility = "hidden";
    document.getElementById("L1").style.visibility = "hidden";
    document.getElementById("box2").style.visibility = "hidden";
    document.getElementById("button2").style.visibility = "hidden";
  
    document.getElementById("text7").style.visibility = "hidden";
    document.getElementById("text8").style.visibility = "hidden";
    document.getElementById("text9").style.visibility = "hidden";
    document.getElementById("L2a").style.visibility = "hidden";
    document.getElementById("box3").style.visibility = "hidden";
    document.getElementById("button3").style.visibility = "hidden";
  
    document.getElementById("text10").style.visibility = "hidden";
    document.getElementById("text11").style.visibility = "hidden";
    document.getElementById("text12").style.visibility = "hidden";
    document.getElementById("w2").style.visibility = "hidden";
    document.getElementById("box4").style.visibility = "hidden";
    document.getElementById("button4").style.visibility = "hidden";
  
  
  
  
  
  
  
  
  
  }
  function navNext0a() {
    document.getElementById("canvas0").style.visibility = "hidden";
    document.getElementById("canvas1a").style.visibility = "hidden";
    document.getElementById("canvas1b").style.visibility = "hidden";
  
    document.getElementById("canvas1c").style.visibility = "hidden";
    document.getElementById("canvas1d").style.visibility = "hidden";
    document.getElementById("canvas1e").style.visibility = "hidden";
  
    document.getElementById('s1_1').style.visibility = "hidden";
    document.getElementById("nextButton1").style.visibility = "hidden";
    document.getElementById("nextButton2").style.visibility = "hidden";
    document.getElementById("nextButton3").style.visibility = "hidden";
    document.getElementById("nextButton4").style.visibility = "hidden";
    document.getElementById("nextButton5").style.visibility = "hidden";
    document.getElementById("nextButton6").style.visibility = "hidden";
    document.getElementById("canvas1").style.visibility = "visible";
  
  
  }
  
  
  
  function navNext1a() {
    document.getElementById("canvas1").style.visibility = "hidden";
    document.getElementById("canvas1a").style.visibility = "visible";
    setTimeout(function () {
      document.getElementById('"arw1"').style.visibility = "visible";
      document.getElementById('button50').style.visibility = "visible";
    }, 1000);
    document.getElementById('addspecimen1').style.visibility = "visible";
    document.getElementById('addspecimen1').style.animation = "addspecimen1 2s forwards";
  
  }
  
  
  function navNext1b() {
    // document.getElementById('addspecimen1b').style.visibility="visible";
    document.getElementById("canvas1a").style.visibility = "hidden";
    document.getElementById("canvas1b").style.visibility = "visible";
    document.getElementById("text4").style.visibility = "hidden";
    document.getElementById("text5").style.visibility = "hidden";
    document.getElementById("text6").style.visibility = "hidden";
    document.getElementById("box2").style.visibility = "hidden";
    document.getElementById("L1").style.visibility = "hidden";
    document.getElementById("button2").style.visibility = "hidden";
    document.getElementById("nextButton1").style.visibility = "hidden";
    document.getElementById("wrong1a").style.visibility = "visible";
    document.getElementById("wrong1b").style.visibility = "visible";
    document.getElementById("wrong1c").style.visibility = "visible";
    document.getElementById("wrong1d").style.visibility = "visible";
    document.getElementById('fn_img').style.animation = "addspecimen1 2s forwards";
  
  }
  
  
  function navNext1c() {
    // document.getElementById("canvas1b").style.visibility = "hidden";
    document.getElementById("canvas1c").style.visibility = "visible";
    // document.getElementById('addspecimen2b').style.visibility = "visible";
    // document.getElementById("nextButton2").style.visibility = "hidden";
    // document.getElementById('text16').style.visibility = "hidden";
    // document.getElementById('box6').style.visibility = "hidden";
    // document.getElementById('text17').style.visibility = "hidden";
    // document.getElementById('text17b').style.visibility = "hidden";
    // document.getElementById('box7').style.visibility = "hidden";
    // document.getElementById('text18').style.visibility = "hidden";
    // document.getElementById('text18b').style.visibility = "hidden";
    // document.getElementById('box8').style.visibility = "hidden";
    // document.getElementById('text19').style.visibility = "hidden";
    // document.getElementById('text19b').style.visibility = "hidden";
    // document.getElementById('eq1').style.visibility = "hidden";
    // document.getElementById('eq2').style.visibility = "hidden";
    // document.getElementById('eq3').style.visibility = "hidden";
    // document.getElementById('eq4').style.visibility = "hidden";
  }
  
  
  
  