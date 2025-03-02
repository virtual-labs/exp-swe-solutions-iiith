## Wave Equation
In quantum mechanics, a small particle like electron, is known to exist both as a particle and as a wave (wave-particle duality).
The wave equation describes the movement of energy and is expressed in the form of amplitude or energy with respect to location and time. In quantum mechanics, the wave equation is known as the Schrödinger equation, which represents the probability of finding the particles in space.

## Schrödinger Wave Equation
The Schrödinger equation is a fundamental equation in quantum mechanics that describes how the quantum state of a physical system changes with time. For a particle of mass \( m \) in a potential \( V(x) \), the time-independent Schrödinger equation is:

\[
\frac{\hbar^2}{2m} \frac{d^2\psi}{dx^2} + V(x)\psi = E\psi
\]

## Key Definitions
- **Wave function (\( \psi \))**: Describes the behavior of the particle system (or particle wave) and all the system variables defining it. \( \psi \) is an expression of location (x, y, z in 3D) and time (t).
- **Probability density (\( \psi^*\psi \))**: It is the conjugate product of the wave function, giving the probability of finding the particle.
- **Quantization**: The solution of the Schrödinger wave equation (\( \psi \)) for a given bounded system exists only for specific values of energy and \( \psi \). Thus, the energy and wavefunction are quantized. The number representing its quantized state is called the **Quantum number** (usually denoted by \( n \)).
- **E**: Represents the energy of the particle in the system.
- **V(x, y, z)**: Represents the system potential in three dimensions.

## Free Space
In free space, the particle is free to move around as the particle energy is much higher than the system potential. Consider the simple 1D case, where the particle exists freely and the system potential \( V(x) = 0 \).

\[
\frac{d^2\psi}{dx^2} + \frac{2mE}{\hbar^2}\psi = 0
\]

The solution to this Schrödinger wave equation is sinusoidal, with system boundary conditions leading to quantized wave solutions and allowed energy levels.

### Free Space Example: Electron Gun
Consider an electron gun that emits electrons with a certain energy. These electrons can be described by a wave function, and their behavior can be analyzed using the Schrödinger equation. In a region with no potential (free space), away from the influence source of the gun and before they get under the potential of the anode, the electrons will exhibit wave-like properties.

## Infinite Potential Well
In an infinite potential well, the system potential \( V(x) \) is zero inside the well (similar to free space), but infinite at and outside the well walls. This creates boundary conditions: the wave function is zero at and beyond the walls of the well. The solution in the well is sinusoidal and represents standing waves, with quantized solution modes and allowed energy levels given by:

\[
E_n = \frac{n^2 \pi^2 \hbar^2}{2mL^2}
\]

where \( L \) is the width of the well and \( n \) is a positive integer.

## Finite Potential Well
A finite potential well is a potential well where the well boundaries are defined by potential greater than particle energy but finite. Inside the well, we again assume zero potential (like in the infinite potential well) and finite value \( V(x) \) at the boundary and beyond. The wave function inside the well is similar to that of the infinite well (i.e., free space solution), but outside the well, the wave function decays exponentially. The energy levels are also quantized but differ from those of the infinite well due to the finite potential barriers.

The wave function must satisfy the normalization condition:

\[
\int_{-\infty}^{\infty} |\psi(x)|^2 \, dx = 1
\]

This normalization condition ensures that the particle exists somewhere in space.
