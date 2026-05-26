import baseConfig from '@epic-web/config/prettier'

export default {
	...baseConfig,
	plugins: [
		...(baseConfig.plugins || []),
		'@zackad/prettier-plugin-twig',
		'@prettier/plugin-php',
	],
	twigMultiTags: [
		'nav,endnav',
		'switch,case,default,endswitch',
		'ifchildren,endifchildren',
		'cache,endcache',
		'paginate,endpaginate',
		'js,endjs',
		'css,endcss',
		'dd,enddd',
		'matrix,endmatrix',
		'namespace,endnamespace',
		'tag,endtag',
	],
}
