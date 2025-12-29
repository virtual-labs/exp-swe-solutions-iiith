## Wave Equation 
In quantum mechanics, a small particle like electron, is known to exist both as a particle and as a wave (wave particle duality).
The wave equation describes the movement of energy and is expressed in form of amplitude or energy with respect to location and time In quantum mechanics, the wave equation is known as the Schrödinger equation, which represents the probability of finding the particles in space.


## Schrödinger Wave Equation
The Schrödinger equation is a fundamental equation in quantum mechanics that describes how the quantum state of a physical system changes with time. For a particle of mass $m$ in a potential $V(x)$, the time-independent Schrödinger equation is given by **Equation 1**. By using variable separation, location ($x$) and time ($t$) can be separated out into the time-independent SWE (**Equation 2**) and the time-based equation with exponential solution as shown (**Equation 3**).

$$-\frac{\hbar^2}{2m}\nabla^2\psi + V(x)\psi = E\psi$$
<div align="center"><b>Equation 1</b></div>

$$\frac{d^2\psi}{dx^2} + \frac{2m}{\hbar^2}[E - U(x)]\psi = 0$$
<div align="center"><b>Equation 2</b></div>

$$i\hbar\frac{\partial\Psi}{\partial t} = E\Psi$$
<div align="center"><b>Equation 3</b></div>

$$\Psi(x,t) = \psi(x)e^{-iEt/\hbar}$$
<div align="center"><b>Equation 4</b></div>

The wave function is finite. If wave function is $\psi(x)$ then at $x = -\infty$ and $x = +\infty$, $\psi(x) = 0$.
$\psi(x)$ must be continuous across all boundaries. No discontinuity can exist.
The derivative $\partial\psi(x)/\partial x$ must be continuous also.
The wave function must be zero where system potential $V(x)$ is infinity.



## Key definitions


- **Wave function (ψ):** Describes the behavior of the particle system (or particle wave) and all the system variables defining it. $\psi$ is an expression of
location (x, y, z in 3D) and time (t).
- **Probability density (ψ*ψ):** It is the conjugate product of the wave function, gives the probability of finding the particle
- **Quantization:** The solution of SWE, ψ, for a given bounded system exists only for specific values of Energy and ψ. Thus, the Energy and Wavefunction are
`quantized’. Number representing its quantized state is called the ‘Quantum number’ usually denoted by ’n’.
-**E :** represents the energy of the particle in the system.
-**V(x,y,z)** is the system potential in 3 dimension.





## Free Space

In free space,particle is free to move around in space as particle energy is much higher than system potential.
Consider the simple 1D case, where particle exists freely and system potential is
 $V(x) = 0$
<br>
$$\frac{d^2\psi}{dx^2} + \frac{2mE}{\hbar^2}\psi = 0$$
<div align="center"><b>Equation 5</b></div>

<br>
The solution to this SWE is given by **Equation 6**, which is simplified to **Equation 7**. With system boundary conditions, we see that the quantized wave solution to this is represented by **Equation 8** and allowed energy levels by **Equation 9**.

<br>

$$\psi(x) = A\sin(kx) + B\cos(kx)$$
<div align="center"><b>Equation 6</b></div>

$$\psi_n(x) = \sqrt{\frac{2}{L}}\sin\left(\frac{n\pi x}{L}\right)$$
<div align="center"><b>Equation 7</b></div>
<br>
<br>
Free Space  Example :Electron gun 
<!-- $$ E = \frac{n^2 \pi^2 \hbar^2}{2m a^2} $$ -->

Consider an electron gun that emits electrons with a certain energy, These electrons can be described by a wave function, and their behavior can be analyzed using the Schrödinger equation. In a region with no potential (free space), away from the influence source of Gun & before they get under the potential the anode, the electrons will exhibit wave-like properties.


## Infinite Potential Well

In an infinite potential well, the system potential $V(x)$ is zero inside the well (similar to free space), but infinite at and outside the well walls. This creates boundary conditions: the wave function is zero at and beyond the walls of the well. The solution in the well is sinusoidal (**Equation 7**) given in standing waves (like a flute), and with quantized solution modes (**Equation 8**) and with allowed energy level as shown in **Equation 9**:
where $L$ is the width of the well and $n$ is a positive integer.
<br>

$$\psi_n(x) = \sqrt{\frac{2}{L}}\sin\left(\frac{n\pi x}{L}\right)$$
<div align="center"><b>Equation 7</b></div>

$$k_n = \frac{n\pi}{L}, \quad n = 1, 2, 3, ...$$
<div align="center"><b>Equation 8</b></div>

$$E_n = \frac{n^2\pi^2\hbar^2}{2mL^2}, \quad n = 1, 2, 3, ...$$
<div align="center"><b>Equation 9</b></div>
<br>


## Finite Potential Well
Finite potential well is a potential well where the well boundaries are defined by potential greater than particle energy but finite.
Inside the well, we again assume zero potential (like in the infinite potential well) and finite value $V(x)$ at the boundary and beyond.
The wave function inside the well is similar to that of the infinite well (i.e., free space solution), but outside the well, the wave function decays exponentially (see **Equation 10**: note exponent is a real number). The energy levels are also quantized but differ from those of the infinite well due to the finite potential barriers.
<br>

$$\psi(x) = Ae^{-\kappa x} \text{ for } x > L/2, \quad \text{where } \kappa = \sqrt{\frac{2m(V_0-E)}{\hbar^2}}$$
<div align="center"><b>Equation 10</b></div>
<br>
This normalization condition ensures that the particle exists somewhere in space.
