jQuery.noConflict()(function($){
"use strict";

    $(document).ready(function() {
        $(".rotate").textrotator({
          animation: "dissolve", // You can pick the way it animates when rotating through words. Options are dissolve (default), fade, flip, flipUp, flipCube, flipCubeUp and spin.
          separator: ",", // If you don't want commas to be the separator, you can define a new separator (|, &, * etc.) by yourself using this field.
          speed: 3000 // How many milliseconds until the next word show.
        });

        function slider_dots(element){
            var i = 0,
            attr = element.attr('id'),
            dotsWrap = element.find('.carousel-indicators'),
            dotClass = '',
            innerSlide = element.find('.carousel-inner .item');

            innerSlide.eq(0).addClass('active');

            for(; i < innerSlide.length; i++){
                if(i == 0){
                    dotsWrap.append('<li data-target="#'+attr+'" data-slide-to="'+i+'" class="active"></li>');
                } else {
                    dotsWrap.append('<li data-target="#'+attr+'" data-slide-to="'+i+'"></li>');
                }
                
                
            }
        }

        slider_dots($('#carousel-intro'));
    

        $('.carousel-big').carousel({
            interval: 6500, //changes the speed
            pause: "false"
        })

        $('.pheromone_vc_button').each(function(index, element) {
            var pheromone_color = $( this ).css( "color" );
            var pheromone_bg = $( this ).css( "background-color" );
            var pheromone_border_color = $( this ).css( "borderTopColor" );
            $(element).hover(
                function() {
                    $(this).css({
                        'color' :$( this ).attr('data-title-color-hover'),
                        'background' :$( this ).attr('data-bg-color-hover'),
                        'border-color' :$( this ).attr('data-border-c-hover'),
                    });
                },
                function() {
                    $(this).css({
                        'color' :pheromone_color,
                        'background' :pheromone_bg,
                        'border-color' :pheromone_border_color,
                    });
                }
            );
        });
        
        $('.pheromone_owl_slider').each(function(index, element) {
            var id =$(element).attr('id');
            if ( $('#'+id).attr('data-arrows') == 'true' ) {
                $( '<i class="fa fa-angle-right"></i>' ).css('font-size',$(element).attr('data-icon-size')).appendTo( $('#'+id+' .owl-next') );
                $( '<i class="fa fa-angle-left"></i>' ).css('font-size',$(element).attr('data-icon-size')).appendTo( $('#'+id+' .owl-prev') );
                var pheromone_color = $( this ).attr('data-color');
                var pheromone_color_h = $( this ).attr('data-color-hover');
                $('#'+id+' .owl-nav i').hover(
                    function() {
                        $(this).css({
                            'color' :pheromone_color_h,
                        });
                    },
                    function() {
                        $(this).css({
                            'color' :pheromone_color
                        });
                    }
                );
            }
        });
        
        
        
        $.fn.equalizeHeights = function () {
            return this.height(Math.max.apply(this, $(this).map(function (i, e) {
                return $(e).height()
            }).get()))
        };
        $('.pheromone_inner_equalize_heights .wpb_column').equalizeHeights();

    });


    
            /***********************************************
         *  jQuery Animated Number
         *  Developers: Arun David, Boobalan
         ***********************************************/

        $(window).on("load",function(){
            $(document).scrollzipInit();
            $(document).rollerInit();
        });
        $(window).on("load scroll resize", function(){
            $('.numscroller').scrollzip({
                showFunction    :   function() {
                    numberRoller($(this).attr('data-slno'));
                },
                wholeVisible    :     false,
            });
        });
        $.fn.scrollzipInit=function(){
            $('body').prepend("<div style='position:fixed;top:0;left:0;width:0;height:0;' id='scrollzipPoint'></div>" );
        };
        $.fn.rollerInit=function(){
            var i=0;
            $('.numscroller').each(function() {
                i++;
                $(this).attr('data-slno',i);
                $(this).addClass("roller-title-number-"+i);
            });
        };
        $.fn.scrollzip = function(options){
            var settings = $.extend({
                showFunction    : null,
                hideFunction    : null,
                showShift       : 0,
                wholeVisible    : false,
                hideShift       : 0
            }, options);
            return this.each(function(i,obj){

                var numbers = $('#scrollzipPoint');
                if (numbers.length) {

                    $(this).addClass('scrollzip');
                    if (!(!$.isFunction(settings.showFunction) || $(this).hasClass('isShown') || $(window).outerHeight() + $('#scrollzipPoint').offset().top - settings.showShift <= $(this).offset().top + (settings.wholeVisible ? $(this).outerHeight() : 0) || $('#scrollzipPoint').offset().top + (settings.wholeVisible ? $(this).outerHeight() : 0) >= $(this).outerHeight() + $(this).offset().top - settings.showShift)) {
                        $(this).addClass('isShown');
                        settings.showFunction.call(this);
                    }
                    if ($.isFunction(settings.hideFunction) && $(this).hasClass('isShown') && ($(window).outerHeight() + $('#scrollzipPoint').offset().top - settings.hideShift < $(this).offset().top + (settings.wholeVisible ? $(this).outerHeight() : 0) || $('#scrollzipPoint').offset().top + (settings.wholeVisible ? $(this).outerHeight() : 0) > $(this).outerHeight() + $(this).offset().top - settings.hideShift)) {
                        $(this).removeClass('isShown');
                        settings.hideFunction.call(this);
                    }
                    return this;
                }
            });
        };

        function numberRoller(slno){
            var min=$('.roller-title-number-'+slno).attr('data-min');
            var max=$('.roller-title-number-'+slno).attr('data-max');
            var timediff=$('.roller-title-number-'+slno).attr('data-delay');
            var increment=$('.roller-title-number-'+slno).attr('data-increment');
            var numdiff=max-min;
            var timeout=(timediff*1000)/numdiff;
            //if(numinc<10){
            //increment=Math.floor((timediff*1000)/10);
            //}//alert(increment);
            numberRoll(slno,min,max,increment,timeout);
        }
        function numberRoll(slno,min,max,increment,timeout){//alert(slno+"="+min+"="+max+"="+increment+"="+timeout);
            if(min<=max){
                $('.roller-title-number-'+slno).html(min);
                min=parseInt(min, 10)+parseInt(increment, 10)
                setTimeout(function(){numberRoll(eval(slno),eval(min),eval(max),eval(increment),eval(timeout))},timeout);
            }else{
                $('.roller-title-number-'+slno).html(max);
            }
        }
});