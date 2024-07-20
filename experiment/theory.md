# Theory

## Wave Equation

The wave equation describes the behavior of waves, including sound waves, light waves, and quantum mechanical waves. In quantum mechanics, the wave equation is known as the Schrödinger equation, which determines the allowed energy levels of a quantum system and the probability of finding a particle in a given state.

## Parameters

- **Wave function (ψ):** Describes the quantum state of a particle and contains all the information about the system.
- **Probability density (|ψ|^2):** The probability of finding a particle in a particular location, given by the square of the wave function's magnitude.
- **Quantum number (n):** Determines the energy level and the shape of the wavefunction.

## Schrödinger Wave Equation

The Schrödinger equation is a fundamental equation in quantum mechanics that describes how the quantum state of a physical system changes with time. For a particle of mass \( m \) in a potential \( V(x) \), the time-independent Schrödinger equation is:

\[ -\frac{\hbar^2}{2m} \frac{d^2 \psi}{dx^2} + V(x)\psi = E\psi \]

where \( \hbar \) is the reduced Planck's constant, \( \psi \) is the wave function, \( V(x) \) is the potential energy, and \( E \) is the energy of the system.

## Free Space

In free space, where the potential \( V(x) = 0 \), the Schrödinger equation simplifies to:

\[ \frac{d^2 \psi}{dx^2} + \frac{2mE}{\hbar^2} \psi = 0 \]

This equation has sinusoidal solutions, indicating that a free particle can have any energy and its wave function oscillates sinusoidally.

## Electron Gun Example

Consider an electron gun that emits electrons with a certain energy. These electrons can be described by a wave function, and their behavior can be analyzed using the Schrödinger equation. In a region with no potential (free space), the electrons will exhibit wave-like properties.

## Infinite Potential Well

In an infinite potential well, the potential \( V(x) \) is zero inside the well and infinite outside. This creates boundary conditions that the wave function must be zero at the walls of the well. The solutions are standing waves, and the allowed energies are quantized:

\[ E_n = \frac{n^2 \pi^2 \hbar^2}{2mL^2} \]

where \( L \) is the width of the well and \( n \) is a positive integer.

## Finite Potential Well

In a finite potential well, the potential \( V(x) \) is finite outside the well. The wave function inside the well is similar to that of the infinite well, but outside the well, the wave function decays exponentially. The energy levels are also quantized but differ from those of the infinite well due to the finite potential barriers.

## Probability of Finding a Particle

The probability of finding a particle in a given region is determined by the integral of the probability density over that region. For a normalized wave function, the total probability over all space is 1:

\[ \int_{-\infty}^{\infty} |\psi(x)|^2 \, dx = 1 \]

This normalization condition ensures that the particle exists somewhere in space.
