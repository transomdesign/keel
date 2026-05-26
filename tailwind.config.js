/** @type {import('tailwindcss').Config} */
export default {
	// This config helps IDEs understand Tailwind v4 setup
	content: ['./templates/**/*.{twig,html}', './src/**/*.{js,ts,css}'],
	// v4 uses CSS-first configuration, but this helps language servers
	theme: {},
	plugins: [],
}
