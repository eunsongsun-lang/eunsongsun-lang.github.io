requirejs.config({
    baseUrl: js_config.theme_base + '/js',
    paths: {
        jquery:                     'jquery-3.7.1.min',
        history:                    'jquery.history',
        Headroom:                   'headroom.min',
        ScrollMagic:                'ScrollMagic.min',
        'ScrollMagic.jquery':       'jquery.ScrollMagic.min',
        'ScrollMagic.indicators':   'ScrollMagic.addIndicators',
        gsap:                       'animation.gsap.min',
        TweenLite:                  'TweenLite.min',
        TweenMax:                   'TweenMax.min',
        TimelineMax:                'TimelineMax.min',
        Flickity:                   'flickity.pkgd.min',
        mediaelementjs:             'mediaelement-and-player.min',
        Masonry:                    'masonry.pkgd.min',
        Modernizr:                  'modernizr.3.3.1.touch.min',
        infiniteScroll:             'jquery.infinitescroll.min'
    },
    shim: {
        history:        ['jquery'],
        Headroom:       ['jquery'],
        ScrollMagic:    ['jquery'],
        Flickity:       ['jquery'],
        mediaelementjs: ['jquery'],
        Masonry:        ['jquery'],
        infiniteScroll: ['jquery'],
        Modernizr: {
            exports: 'Modernizr'
        }
    }
});

requirejs( [ 'require', 'jquery', 'Headroom', 'ScrollMagic', 'Flickity', 'Modernizr', 'history'/*, 'ScrollMagic.indicators'*/ ],
    function( require, $, Headroom, ScrollMagic, Flickity, Modernizr ) {

        var
            $w = $( window ),
            $main = $("#main"),
            touch_events = Modernizr.touchevents,
            header_height,
            header_height_is_small,
            masthead = document.getElementById("main-navigation"),
            $main_nav = $("#main-navigation"),
            $site_title = $("#site-title"),
            headroom_offset = $(".home").length && !touch_events ? 900 : 0,
            headroom,
            headroom_timer,
            controller = new ScrollMagic.Controller(),
            title_controller,
            $fixed = $("#fixed-title"),
            fixed_header_init,
            fixed_header_enabled = true,
            parallax,
            $flickity = [],
            $caption = [],
            flkty = [],
            flickity_options,
            flickity_options_before = {},
            flickity_init,
            video_init,
            video_controller,
            scroll_indicator_init,
            ajax_get_post_callback,
            ajax_update_list_count,
            $sortable = $("#sortable"),
            $sortable_li = $sortable.find("li"),
            $masonry = $(".masonry-container"),
            manual_state_change = true,
            iOSversion;



        /*--------------------------------------------------------------
         ## Functions
         --------------------------------------------------------------*/
        //compare 2 objects
        function isEquivalent(a, b) {
            var aProps = Object.getOwnPropertyNames(a);
            var bProps = Object.getOwnPropertyNames(b);
            if (aProps.length != bProps.length) {
                return false;
            }
            for (var i = 0; i < aProps.length; i++) {
                var propName = aProps[i];
                if (a[propName] !== b[propName]) {
                    return false;
                }
            }
            return true;
        }



        function windowScroll( pos, dur ) {
            var dur = dur || 800;
            $("html:not(:animated),body:not(:animated)").stop().animate({
                scrollTop: pos
            }, dur );
        }



        //detect iOS version
        (iOSversion = function() {
            if (/iP(hone|od|od touch|ad)/.test(navigator.platform)) {
                var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
                return parseInt(v[1], 10) >= 10;
                //return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
            } else {
                return true;
            }
        });



        /*--------------------------------------------------------------
         ## Flickity
         --------------------------------------------------------------*/
        //set slideshow options
        function set_flickity_options( mobile ) {
            if ( mobile ) {
                flickity_options = {
                    freeScroll: true,
                    freeScrollFriction: 0.03,
                    dragThreshold: 2,
                    wrapAround: true,
                    pageDots: false,
                    imagesLoaded: true,
                    prevNextButtons: false
                };
            } else {
                flickity_options = {
                    wrapAround: true,
                    pageDots: false,
                    imagesLoaded: true
                };
            }
        }



        (flickity_init = function() {
            require( [ 'jquery-bridget/jquery-bridget' ], function( jQueryBridget ) {
                jQueryBridget('flickity', Flickity, $);

                $('.carousel').each( function( index ) {
                    $flickity[ index ] = $(this).flickity(
                        flickity_options
                    );
                    $caption[ index ]  = $flickity[ index ].siblings('.caption');
                    flkty[ index ] = $flickity[ index ].data('flickity');

                    $flickity[ index ].on( "select.flickity", function() {
                        $(this).siblings(".pager").find(".position").text( flkty[ index ].selectedIndex + 1 ).end()
                            .find(".total").text( flkty[ index ].slides.length );
                        if ( $caption[ index ].length ) {
                            $caption[ index ].html( $( flkty[ index ].selectedElement ).data('caption') );
                        }
                    })
                        .off("staticClick.flickity")
                        .on("staticClick.flickity", function() {
                            //$flickity[ index ].flickity('resize');
                            $flickity[ index ].flickity('next');
                        if ( header_height_is_small ) {
                            windowScroll( $flickity[ index ].position().top - 10, 400 );
                        } else {
                            windowScroll( $flickity[ index ].position().top - ( ( $w.height() - $flickity[ index ].height() ) / 2 ), 400 );
                        }
                    });

                    // setTimeout( function() {
                    //     $flickity[ index ].flickity('resize');
                    // }, 4000 );
                });
            });
        });



        /*--------------------------------------------------------------
         ## Index
         --------------------------------------------------------------*/
        function get_span_val( row, index ){
            return $( row ).find("span:not(.color-grey)").eq( index ).html();
        }



        function compare_content( index ) {
            return function( a, b ) {
                var
                    valA = get_span_val( a, index ),
                    valB = get_span_val( b, index );
                return $.isNumeric( valA ) && $.isNumeric( valB ) ? valA - valB : valA.localeCompare( valB )
            }
        }



        $('#index-list header a').on("click", function() {
            var
                $this = $(this),
                rows;

            $this.addClass("active").siblings().removeClass("active");
            rows = $sortable_li.toArray().sort( compare_content( $this.index() ) );
            this.asc = !this.asc;

            if ( !this.asc ) {
                rows = rows.reverse()
            }
            for ( var i = 0; i < rows.length; i++ ){
                $sortable.append( rows[ i ] )
            }
        });



        function set_sortable_index() {
            if ( touch_events ) {
                $sortable_li.off(".index").find(".index-link").off(".index-img").one("click.index-img", function( event ) {
                    event.preventDefault();
                    var
                        $this = $(this),
                        $li = $this.parent(),
                        $cont = $li.find(".index-img"),
                        img;

                    if ( $li.data().img ) {
                        img = ( !!$this.attr("href") ? '<a href="' + $this.attr("href") + '">' : '') + '<img src="' + $li.data().img + '" srcset="' + $li.data().img + ' 1x' + ( $li.data().retina.length ? ',' + $li.data().retina + ' 2x' : '' ) + '" width="' + $li.data().width + '" height="' + $li.data().height + '" />' + ( !!$this.attr("href") ? '</a>' : '');

                        $cont.prepend( img );
                        $li.removeData( img );
                    }
                }).on("click.index", function( event ) {
                    event.preventDefault();
                    var $this = $(this);
                    $this.parent().find(".index-img").fadeToggle();
                    windowScroll( $this.offset().top - 14 );
                });
            } else {
                $sortable_li.off(".index").find(".index-link").off(".index-img").end()
                    .one("mouseenter.index", function() {
                        //append image to .index-img
                        var $this = $(this);
                        $this.find(".index-img").empty().prepend('<img src="' + $this.data().img + '" srcset="' + $this.data().img + ' 1x' + ( $this.data().retina.length ? ',' + $this.data().retina + ' 2x' : '' ) + '" width="' + $this.data().width + '" height="' + $this.data().height + '" />');
                    })
                    .find(".index-img").removeAttr("style").end()
                    .on("mousemove.index", function( event ) {
                        var
                            $this = $(this),
                            $img = $this.find(".index-img"),
                            mp = event.clientX,
                            wi = $w.width() - $img.width();
                        $img.css({
                            left: mp < wi ? mp : wi
                        });
                    });
            }
        }



        /*--------------------------------------------------------------
         ## Responsive
         --------------------------------------------------------------*/
        //break-points
        var mqls = [
            window.matchMedia( "(min-width: 1025px)" ),
            window.matchMedia( "(max-width: 1024px) and (min-width: 769px)" ),
            window.matchMedia( "(max-width: 768px) and (min-width: 500px)" ),
            window.matchMedia( "(max-width: 500px)" )
        ];



        //break-point functions
        function mediaqueryresponse( mql ){
            if ( ( mql.media == "(max-width: 500px)" || mql.media == "all and (max-width:500px)" ) && mql.matches ) {
                set_flickity_options( true );
                set_sortable_index();
                header_height_is_small = true;
            } else if ( ( mql.media == "(max-width: 768px) and (min-width: 500px)" || mql.media == "all and (max-width:768px) and (min-width:500px)" ) && mql.matches ) {
                set_flickity_options( true );
                set_sortable_index();
                header_height_is_small = true;
            } else if ( ( mql.media == "(max-width: 1024px) and (min-width: 769px)" || mql.media == "all and (max-width:1024px) and (min-width:769px)" ) && mql.matches ) {
                set_flickity_options( false );
                set_sortable_index();
                header_height_is_small = false;
            } else if ( ( mql.media == "(min-width: 1025px)" || mql.media == "all and (min-width:1025px)" ) && mql.matches ) {
                set_flickity_options( false );
                set_sortable_index();
                header_height_is_small = false;
            }

            if ( typeof( flickity_options ) == 'object' && !isEquivalent( flickity_options_before, flickity_options ) ) {
                if ( $flickity.length ) {
                    //destroy slideshow, if options have changed and slideshow already active
                    for (var i = 0; i < $flickity.length; i++) {
                        $flickity[i].flickity('destroy');
                    }
                }
                //create slideshow
                flickity_init();
                flickity_options_before = flickity_options;
            }
        }



        //break-point listeners
        for ( var i = 0; i < mqls.length; i++ ){
            mediaqueryresponse(mqls[i]);
            mqls[i].addListener(mediaqueryresponse);
        }



        function isRetina() {
            //for retina screen
            return (( window.matchMedia && ( window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 2),(min-resolution: 192dpi)').matches )));
        }
        function isPortrait() {
            //for mobile special pics
            return (( window.matchMedia && ( window.matchMedia('only screen and (max-device-width: 480px) and (-webkit-min-device-pixel-ratio: 2)').matches )));
        }

        //lazy-load the parallax backgrounds (data-bg, see jnz_hero_bg()) one screen ahead of the viewport
        var lazy_bg_observer;

        function lazy_bg_load( el ) {
            var src = ( isPortrait() && el.getAttribute('data-bg-mobile') ) || ( isRetina() && el.getAttribute('data-bg-retina') ) || el.getAttribute('data-bg');
            el.style.backgroundImage = 'url("' + src + '")';
            el.removeAttribute('data-bg');
        }

        function lazy_bg_init() {
            var els = document.querySelectorAll('.img-container[data-bg]');

            if ( !( 'IntersectionObserver' in window ) ) {
                for ( var i = 0; i < els.length; i++ ) {
                    lazy_bg_load( els[ i ] );
                }
                return;
            }

            if ( !lazy_bg_observer ) {
                lazy_bg_observer = new IntersectionObserver( function( entries ) {
                    for ( var i = 0; i < entries.length; i++ ) {
                        if ( entries[ i ].isIntersecting ) {
                            lazy_bg_observer.unobserve( entries[ i ].target );
                            lazy_bg_load( entries[ i ].target );
                        }
                    }
                }, { rootMargin: '100% 0px' } );
            }

            for ( var i = 0; i < els.length; i++ ) {
                lazy_bg_observer.observe( els[ i ] );
            }
        }



        /*--------------------------------------------------------------
         ## Header
         --------------------------------------------------------------*/
        //header height
        header_height = function() {
            if ( header_height_is_small ) {
                var
                    portrait = $w.width() * 1.33,
                    landscape = $w.width() * 0.75;

                $("#single-parallax-image, .parallax-image, .home-video").each( function() {
                    var $this = $(this);
                    if ( $this.is(".home-portrait") ) {
                        $this.height( portrait );
                    } else {
                        $this.height( landscape );
                    }
                });
            } else {
                $("#single-parallax-image, .parallax-image, .home-video").height( $w.height() );
            }

            fixed_header_init();
            scroll_indicator_init();
        };



        //Page title (home)
        if ( $site_title.length ) {
            new ScrollMagic.Scene({
                offset: 150,
                triggerHook: "onLeave"
            })
                .setClassToggle("#site-title", "transformed")
                .addTo(controller);

            $site_title.on("click", function() {
                $site_title.addClass("transformed");
                $(".menu-toggle").trigger("click");
            });
        }



        //scroll-indicator
        scroll_indicator_init = function() {
            new ScrollMagic.Scene({
                offset: 150,
                triggerHook: "onLeave"
            })
                .setClassToggle("#scroll-indicator", "transformed")
                .addTo( controller );
        };



        //Headroom
        headroom  = new Headroom( masthead, {
            offset: headroom_offset,
            tolerance : {
                up : 5,
                down : 0
            },
            onPin: function() {
                //if ( touch_events ) {
                    clearTimeout( headroom_timer );
                    var $this = this;

                    headroom_timer = setTimeout( function () {
                        if ( $w.scrollTop() > 0 ) {
                            $this.unpin();
                        }
                    }, 3500);
                //}
            },
            onUnpin : function() {
                clearTimeout( headroom_timer );
            }
        });
        headroom.init();




            //jQuery ready
        $(function () {



            //menu
            $(".menu-toggle").on("click", function( event ) {
                event.preventDefault();
                var
                    $this = $(this),
                    $menu = $(".menu-container");
                if ( $menu.is(":visible") ) {
                    $this.text("Menu");
                    $menu.slideUp();
                } else {
                    $this.text("Close");
                    $menu.slideDown();
                }
                clearTimeout( headroom_timer );
            });

            $main_nav.on("mouseenter", function() {
                clearTimeout( headroom_timer );
            });



            //open external links or press links to pdf in new window
            $("a").filter( function() {
                var $this = $(this);
                return ( ( this.hostname && this.hostname !== location.hostname ) || $this.is(".type-press-link") ) && $this.attr("href") != '#';
            }).click( function() {
                window.open( $(this).attr("href"), 'New window', '');
                return false;
            });




            //reveal videos in the press area
            $(".type-press-link").filter( function() {
                return $(this).attr("href") == '#';
            }).click( function() {
                $(this).fadeOut().closest("article").find(".mejs-overlay-button").trigger("click");
                return false;
            });



            /*--------------------------------------------------------------
             ## Home & Video // ScrollMagic
             --------------------------------------------------------------*/

            //same as player.play(), but catches the promise that rejects when a pause() follows quickly (fast scrolling)
            function play_video( player ) {
                player.load();
                var promise = player.media.play();
                if ( promise && promise.catch ) {
                    promise.catch( function() {} );
                }
            }

            //initialize mediaelementjs
            (video_init = function() {
                video_controller = new ScrollMagic.Controller();

                if ( iOSversion() ) {

                    //the player is only downloaded on pages that have a video
                    if ( !$('.video:not(.mejs-video)').length ) {
                        return;
                    }

                    require( [ 'mediaelementjs' ], function() {
                        $('.video:not(.mejs-video)').each(function () {
                            var
                                $this = $(this),
                                player = new MediaElementPlayer($this, {
                                    features: ['playpause'],
                                    pauseOtherPlayers: false,
                                    loop: true
                                });

                            if ( $(".module-press").length == 0 && ( $this.is(".auto-play") || headroom_offset != 0 ) ) {
                                //add auto-play if not press page
                                new ScrollMagic.Scene({
                                    triggerElement: this,
                                    triggerHook: "onEnter",
                                    duration: $this.height()
                                })
                                    .on("enter", function (event) {
                                        if (event.state == 'DURING') {
                                            play_video( player );
                                        }
                                    })
                                    //.addIndicators()
                                    .addTo(video_controller);

                                new ScrollMagic.Scene({
                                    triggerElement: this,
                                    triggerHook: "onLeave",
                                    duration: $this.height()
                                })
                                    .on("enter leave", function (event) {
                                        if (event.state == 'DURING') {
                                            play_video( player );
                                        }
                                        if (event.state == 'AFTER') {
                                            player.pause();
                                        }
                                    })
                                    //.addIndicators()
                                    .addTo( video_controller );
                            }
                        });
                    });
                } else {
                    $('.video').each(function () {
                        $(this).find("img").insertAfter( this ).end().end().remove();
                    });
                }
            }).call();



            //post fixed header
            (fixed_header_init = function() {

                if ( ! touch_events ) {

                    if ( typeof( title_controller ) == 'object' ) {
                        title_controller.destroy();
                    }

                    title_controller = new ScrollMagic.Controller();

                    $("article.parallax-post .fixed-title-display, article.multi-post-2 .fixed-title-display").each( function() {
                        var
                            $this = $(this).closest('article'),
                            $title = $("#fixed-title");

                        new ScrollMagic.Scene({
                            triggerElement: this,
                            triggerHook: "onCenter",
                            duration: $(this).height()
                        })
                            .on("start", function (event) {
                                var
                                    text,
                                    color,
                                    $scrollIndicator = $("#scroll-indicator");
                                if (event.state == 'DURING' && event.scrollDirection == 'FORWARD') {
                                    //scroll down
                                    var $prev = $this.prev('article.multi-post-1');
                                    if ($prev.length) {
                                        text = '<span' + ( $prev.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $prev.find(".entry-title").text() + '</span>' + '<span' + ( $this.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $this.find(".entry-title").text() + '</span>';
                                    } else {
                                        text = '<span class="single' + ( $this.is("[data-color='text-white']") ? ' text-white' : '' ) + '">' + $this.find(".entry-title").first().text() + '</span>';
                                    }
                                    $scrollIndicator.toggleClass( "fill-white", $this.is("[data-color='text-white']") );

                                } else if (event.state == 'BEFORE' && event.scrollDirection == 'REVERSE') {
                                    //scroll up
                                    var
                                        $prev = $this.prev('article.parallax-post'),
                                        $multi2 = $this.prev('article.multi-post-2'),
                                        $multi1 = $multi2.prev('article.multi-post-1');

                                    //second try to gather previous siblings
                                    $prev = $prev.length ? $prev : $this.prevUntil('article.parallax-post').prev();

                                    //if multiple previous siblings and no multi, check again for multi
                                    if ( $prev.length != 1 && !$multi1.length && !$multi2.length  ) {
                                        $multi2 = $this.prevUntil('article.multi-post-2').prev();
                                        $multi1 = $multi2.prev('article.multi-post-1');
                                    }

                                    if ( $multi1.length && $multi2.length ) {
                                        text = '<span' + ( $multi1.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $multi1.find(".entry-title").text() + '</span>' + '<span' + ( $multi2.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $multi2.find(".entry-title").text() + '</span>';
                                        $scrollIndicator.toggleClass( "fill-white", $multi1.is("[data-color='text-white']") );
                                    } else {
                                        text = '<span class="single' + ( $prev.is("[data-color='text-white']") ? ' text-white' : '' ) + '">' + $prev.find(".entry-title").text() + '</span>';
                                        $scrollIndicator.toggleClass( "fill-white", $prev.is("[data-color='text-white']") );
                                    }

                                } else {
                                    //on init
                                    var $prev = $this.prev('article.multi-post-2');
                                    if ($prev.length && $this.is(".multi-post-2")) {
                                        text = '<span' + ( $prev.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $prev.find(".entry-title").text() + '</span>' + '<span' + ( $this.is("[data-color='text-white']") ? ' class="text-white"' : '' ) + '>' + $this.find(".entry-title").text() + '</span>';
                                        $scrollIndicator.toggleClass( "fill-white", $prev.is("[data-color='text-white']") );
                                    } else {
                                        text = '<span class="single' + ( $this.is("[data-color='text-white']") ? ' text-white' : '' ) + '">' + $this.find(".entry-title").first().text() + '</span>';
                                        $scrollIndicator.toggleClass( "fill-white", $this.is("[data-color='text-white']") );
                                    }
                                }
                                if ( fixed_header_enabled ) {
                                    $fixed.html(text);
                                }
                            })
                            .on("enter leave", function (e) {
                                //toggle title visibility
                                var toggle = e.type === "enter" ? false : true;
                                $title.toggleClass('hidden', toggle);
                            })
                            //.addIndicators()
                            .addTo(title_controller);
                    });
                }
            });



            /*--------------------------------------------------------------
             ## Ajax
             --------------------------------------------------------------*/
            //ajax call callback
            ajax_get_post_callback = function( response, url ) {
                manual_state_change = false;
                History.pushState( null, response.title, url );
                manual_state_change = true;

                $("article").fadeOut(400, function() {
                    var
                        $this = $(this),
                        $container = $this.parent().css({opacity: 0});

                    $this.remove();
                    $container.append( response.content );

                    $flickity = [];

                    flickity_init();
                    video_init();
                    header_height();
                    lazy_bg_init();
                    fixed_header_enabled = true;

                    setTimeout( function() {
                        $container.animate({opacity: 1});
                    }, 250);
                });
            };



            //external state change (browser navigation)
            $w.bind( 'statechange', function() {
                if( manual_state_change == true ) {
                    var
                        state = History.getState(),
                        url = state.cleanUrl;

                    if ( url.indexOf('/stories/') != -1 ) {
                        $("html:not(:animated),body:not(:animated)").animate({
                            scrollTop: 0
                        }, 400, function () {

                            controller.removeScene( parallax );

                            $main.find('article:not(:first)').fadeOut(400, function() {
                                $(this).remove();
                            });

                        });

                        $("#main-navigation h2 a").removeClass("active");
                        $site_title.addClass("is_single");
                        $("#colophon").slideUp();


                        var path = url.split('/');
                        ajax_get_post( path[ path.length - 2 ], url );
                    } else {
                        window.location.reload( false );
                    }
                }
            });



            //update the list counter in navigation bar
            ajax_update_list_count = function( list_count ) {
                $("#ajax-likes").toggleClass( 'opaque', list_count == 0 ).find(".amount").text( list_count );
                //show header
                $main_nav.removeClass('headroom--unpinned').addClass('headroom--pinned');
            };



            //ajax call
            function ajax_get_post( ajax_data, url ) {
                $.ajax({
                    url: js_config.ajax_url,
                    type: 'post',
                    data: {
                        nonce:  js_config.ajax_nonce,
                        action: 'ajax_get_post',
                        id:     ajax_data
                    },
                    beforeSend: function() {
                        if ( !!video_controller ) {
                            video_controller = video_controller.destroy(true);
                        }
                    },
                    success: function ( response ) {
                        ajax_get_post_callback( response, url );
                    },
                    error: function ( response, textStatus, errorThrown ) {
                        console.log("error", response, textStatus, errorThrown );
                    }
                });
            }



            $main

            //Scroll-indicator
                .on("click", "#scroll-indicator, .single-post .fixed-title-display", function() {
                    windowScroll( $("#module-0").position().top );
                })

            //ajax load project
                .on("click", ".ajax-get-post", function( event ) {
                    event.preventDefault();
                    event.stopPropagation();

                    var $this = $(this);

                    if( !$this.is(".disabled") ) {
                        $("html:not(:animated),body:not(:animated)").animate({
                            scrollTop: $this.offset().top
                        }, 400);

                        fixed_header_enabled = false;
                        $main.find("> article").fadeOut(400, function() {
                            $this.closest('article').siblings().remove();
                            controller.removeScene( parallax );
                            windowScroll( 0, 1 );
                        });

                        $("#main-navigation h2 a").removeClass("active");
                        $site_title.addClass("is_single");
                        $("#colophon").slideUp();

                        ajax_get_post( $this.data().id, $this.attr("href") );

                        $this.addClass("disabled");
                    }

                    return false;
                })

            //ajax like
                .on("click", ".ajax-like", function( event ) {
                    event.preventDefault();
                    var $this = $(this);

                    if( !$this.is(".disabled") ) {
                        $.ajax({
                            url: js_config.ajax_url,
                            type: 'post',
                            data: {
                                nonce:  js_config.ajax_nonce,
                                action: 'ajax_like',
                                id:     $this.data().id,
                                remove: $this.data().remove
                            },
                            success: function ( response ) {
                                if ( $this.is('[data-remove]') ) {
                                    $this.closest("article").slideUp(400, function() {
                                        $(this).remove();
                                        if ( $(".archive-list article").length == 0 ) {
                                            $(".archive-list").slideUp();
                                            $("#list-disclaimer, #list-empty").toggleClass('hidden');
                                        }
                                    });
                                } else {
                                    $this.text( "On your list" );
                                }
                                ajax_update_list_count( response.list_count );
                            },
                            error: function (response, textStatus, errorThrown) {
                                console.log("error", response, textStatus, errorThrown);
                            }
                        });
                        $this.addClass("disabled");
                    }
                })

            //sub navigation
                .on("click", ".sub-navigation ul a", function( event ) {
                    event.preventDefault();
                    var
                        $tar = $( $(this).attr("href") ),
                        $prev = $tar.prev(".sub-navigation"),
                        pos = $tar.position().top - ( $prev.outerHeight() * 2 + 24 ),
                        dur = Math.abs( ( pos - $w.scrollTop() ) / 2 );

                    windowScroll( pos, dur );
                })

            //mobile sub navigation
                .on("click", ".sub-navigation h3 a", function( event ) {
                    event.preventDefault();
                    var
                        $this = $(this),
                        target = $this.attr("class").split("-");
                    //removeClass is required, to reveal ".no-mobile.mod-press + .to-be-loaded"
                    $this.closest("header").next(".mod-" + target[1] ).slideDown().removeClass("no-mobile");
                })

            //mobile social navigation
                .on("click", ".social h3", function() {
                    $(".post-social").slideToggle();
                })

            //ajax load more (image wo margin, press )
                .on("click", ".load-more", function( event ) {
                    event.preventDefault();
                    var $this = $(this);

                    $.ajax({
                        url: js_config.ajax_url,
                        type: 'post',
                        data: {
                            nonce:  js_config.ajax_nonce,
                            action: $this.data().action,
                            id:     $this.data().id,
                            module: $this.data().module
                        },
                        complete: function( response ) {
                            $this.slideUp(400, function() {
                                $this.remove();
                            }).after( response.responseJSON.content )
                                .parent().hide().fadeIn( 800 ).removeClass("to-be-loaded");

                            video_init();
                        }
                    });
                })

            //ajax load more links
                .on("click", ".type-press-link", function() {
                    var $this = $(this);
                    if ( $this.attr("href") == '#' ) {
                        $this.fadeOut().closest("article").find(".mejs-overlay-button").trigger("click");
                    } else {
                        window.open( $this.attr("href"), 'New window', '');
                    }
                    return false;
                })

            //swap versions
                .on("click", "#swap-versions", function( event ) {
                    event.preventDefault();
                    var
                        $this = $(this),
                        text = $this.text(),
                        swap = $this.data("org");

                    $this
                      .text( swap ).data("org", text)
                      .parent().find('.facts-text').toggle();
                })

              .on('click', '.toggle-facts', function(event) {
                  event.preventDefault();
                  var
                    $this = $(this),
                    text = $this.text(),
                    swap = $this.data("org");

                  $this
                    .text( swap ).data("org", text)
                    .parent().find('.facts-text').toggle();
              });



            /*--------------------------------------------------------------
             ## Masonry
             --------------------------------------------------------------*/
            if ( $masonry.length ) {
                require( [ 'Masonry', 'infiniteScroll', 'jquery-bridget/jquery-bridget' ], function( Masonry ) {
                    $.bridget( 'masonry', Masonry );
                    $masonry.imagesLoaded( function() {
                        $masonry.masonry({
                            itemSelector: 'article',
                            columnWidth: '.column-sizer',
                            gutter: '.gutter-sizer',
                            percentPosition: true,
                            transitionDuration: 0
                        });
                    }).infinitescroll({
                        loading: {
                            img: 'data:image/gif;base64,R0lGODlhAQABAHAAACH5BAUAAAAALAAAAAABAAEAAAICRAEAOw==',
                            finishedMsg: '',
                            msgText: ''
                        },
                        navSelector: '.masonry-container > a',
                        nextSelector: '.masonry-container > a',
                        itemSelector: 'article',
                        bufferPx: 500
                    }, function( newElements ) {
                        var $newElems = $(newElements).css("opacity", 0);
                        $newElems.imagesLoaded(function() {
                            $newElems.css("opacity", 1);
                            $masonry.masonry( 'appended', $newElems );
                        });
                    });
                    setInterval( function() {
                        $masonry.masonry();
                    }, 2000 );
                });
            }



            /*--------------------------------------------------------------
             ## Mailchimp
             --------------------------------------------------------------*/
            var
                $mc_form = $('form'),
                $mc_response = $("#mc_response"),
                $mc_error = $("#mc_error"),
                $mc_input = $("#mce-EMAIL");

            if ( $mc_form.length > 0 ) {
                $('#mc-embedded-subscribe-form').on('submit', function( event ) {
                    event.preventDefault();
                    register( $mc_form );
                });
            }



            //focus / focus out
            $mc_input.on( "focus", function() {
                $mc_input.data( "placeholder", $mc_input.attr( "placeholder" ) ).attr( "placeholder", "Email+Enter" );
            }).on( "blur", function() {
                $mc_input.attr( "placeholder", $mc_input.data( "placeholder" ) );
            });



            //ajax subscription
            function register( $form ) {
                $mc_input.removeClass("shake");
                $mc_error.text("");
                $.ajax({
                    type: $form.attr('method'),
                    url: $form.attr('action'),
                    data: $form.serialize(),
                    cache: false,
                    dataType: 'jsonp',
                    jsonp: 'c',
                    contentType: "application/json; charset=utf-8",
                    error: function() {
                        $mc_error.text("Could not connect to the registration server. Please try again later.");
                    },
                    success: function( data ) {
                        if (data.result != "success") {
                            $mc_input.addClass("shake");
                            $mc_error.html( data.msg );
                        } else {
                            $mc_input.animate({
                                opacity: 0
                            }, 400, function() {
                                $mc_response.text("Thank you").slideDown();
                            });
                        }
                    }
                });
            }


            $main.animate({
                opacity: 1
            });



            /*--------------------------------------------------------------
             ## Window
             --------------------------------------------------------------*/
            $w
                .resize( function() {
                    header_height();
                })
                .resize();

            //after header_height(), so the hero sizes are final before observing
            lazy_bg_init();
        });
    }
);
