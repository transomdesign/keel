/// <reference types="vite/client" />

// Allow CSS imports
declare module '*.css' {
	const content: string
	export default content
}

// Splide CSS subpath imports (side-effect only, no exports)
declare module '@splidejs/splide/css' {}
declare module '@splidejs/splide/css/core' {}
