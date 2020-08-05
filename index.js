const postcss = require('postcss');

module.exports = postcss.plugin('postcss-touch-hover', () => {
    return root => {
        // Look for @touch-hover at rule
        root.walkAtRules('touch-hover', atRule => {
            const hoverRules = [];
            const normalRules = [];

            // Start by identifying all :hover rules
            atRule.walkRules(/:hover/i, rule => {
                hoverRules.push(rule);
                rule.remove();
            });

            atRule.walkRules(rule => {
                normalRules.push(rule);
                rule.remove();
            });

            const parent = atRule.parent;

            // If there are any :hover rules in the input, then create media queries
            // to automatically translate it into :active on touch-based devices
            if (hoverRules.length > 0) {
                // Create a media query targetting ie10 + 11, as these browsers
                // wont support @media (hover: hover) - but we know that this
                // browser never runs on mobile devices, so we'll just push the
                // hover rules there
                const ieQuery = parent.append({
                    name: 'media',
                    params: 'all and ' + '(-ms-high-contrast: none), ' + '(-ms-high-contrast: active)',
                }).last;

                // Create a media query targetting firefox, as this browser doesn't
                // support @media (hover: hover)... Technically this browser could
                // run on both desktop and mobile devices, but we're going to be
                // applying :hover and hope for the best
                const firefoxQuery = parent.append({
                    name: 'media',
                    params: 'all and (min--moz-device-pixel-ratio:0)',
                }).last;

                // Create a media query targetting devices that actually support
                // hover
                const hoverQuery = parent.append({
                    name: 'media',
                    params: '(hover: hover)',
                }).last;

                // Create a media query targetting devices that don't support hover
                // (ie. devices where we should fall back to :active instead)
                const activeQuery = parent.append({
                    name: 'media',
                    params: '(hover: none)',
                }).last;

                // Loop through the hover rules and apply them to each of the media
                // queries
                for (const hoverRule of hoverRules) {
                    // Push a clone of the :hover rule 'as is' to queries where we
                    // expect the user's device to support hover
                    ieQuery.append(hoverRule.clone());
                    firefoxQuery.append(hoverRule.clone());
                    hoverQuery.append(hoverRule.clone());

                    // Push a clone of the :hover rule, where we transform the
                    // selector to :active to the query targetting devices that
                    // don't support hover
                    activeQuery.append(
                        hoverRule.clone({
                            selector: hoverRule.selector.replace(/:hover/gi, ':active'),
                        }),
                    );
                }
            }

            parent.append(normalRules);

            atRule.remove();
        });
    };
});
