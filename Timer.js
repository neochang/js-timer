/** 
 * Timer 
 * A timer with setTimeout() and setInterval(), based on rainsilence's Timer version 2.0 
 *  
 * @author ZhangWei 
 * @version 1.0 
 */
(function () {

    /** 
     * TimerEvent constructor 
     *  
     * @param type Event type 
     * @param data Event data: payload of event, can be any object. 
     */
    TimerEvent = function (type, data) {
        this.type = type;
        this.data = data;
    };

    /** 
     * Timer event declaration
     *  
     * @event TIMER Triggers everytime when the time is up.
     * @event TIMER_COMPLETE Triggers when the timer runs to the required repeat count, or when it is stopped.
     */
    extend(TimerEvent, {
        TIMER: "timer",
        TIMER_COMPLETE: "timerComplete"
    });

    /** 
     * TimerEvent Methods 
     * 
     * @method toString 
     */
    extend(TimerEvent.prototype, {
        toString: function () {
            return "[TimerEvent type = " + this.type +
                " data = " + this.data + "]";
        }
    });

    /** 
     * extend: utility function, used to extend the properties or methods of an object.
     * 
     * @param target The target object which will be extended. 
     * @param properties Properties or methods to be added to the target object.
     */
    function extend(target, properties) {

        if (!target) {
            target = {};
        }

        for (var prop in properties) {
            target[prop] = properties[prop];
        }

        return target;
    }



    /** 
     * Timer Constructor 
     * 
     * @param delay The time, in milliseconds，the timer should wait before the callback function is executed. 
     * @param repeatCount If not specified, or null, or 0: no repeat, just once; if < 0, repeat indefinitely.
     */
    Timer = function (delay, repeatCount) {
        var listenerMap = {};
        listenerMap[TimerEvent.TIMER] = [];
        listenerMap[TimerEvent.TIMER_COMPLETE] = [];

        extend(this, {
            delay: delay,
            
            currentCount: 0,
            running: false,
            isCompleted: false,
            timerId: 0,
            startTime: 0,

            repeatCount: ( repeatCount == null || repeatCount == undefined || repeatCount == 0 ) ? 1 : repeatCount,

            // true: setInterval(), false: setTimeout()  
            repeatInfinitely: repeatCount < 0 ? true : false,

            handler: listenerMap
        });
    };

    /** 
     * Timer methods: 
     *  
     * @method addEventListener
     * @method removeEventListener
     * @method start start timer.
     * @method stop stop timer. 
     * @method reset reset timer. 
     */
    extend(Timer.prototype, {

        /** 
         * Add one callback handler for timer.
         * 
         * @param type Required. Specify the type of TimerEvent the listener is interested in.
         * @param listener Required. 
         * @param data Optional. Payload data of the event.
         * @param insertToFront Optional. true: this listener callback will be triggered before other listeners; false: after others.
         */
        addEventListener: function (type, listener, data, insertToFront) {
            if (type == TimerEvent.TIMER || type == TimerEvent.TIMER_COMPLETE) {

                if (!listener) {
                    alert("Timer.addEventListener: Listener is null");
                }

                var handlerPair = {listener: listener, data: data};

                if (insertToFront == true) {
                    this.handler[type].splice(0, 0, handlerPair);
                }
                else {
                    this.handler[type].push(handlerPair);
                }
            }
        },

        removeEventListener: function (type, listener) {
            if (type == TimerEvent.TIMER || type == TimerEvent.TIMER_COMPLETE) {

                if (!listener) {
                    this.handler[type] = [];
                }
                else {

                    var handlerPairs = this.handler[type];

                    for (var index = 0; index < handlerPairs.length; index++) {
                        if (handlerPairs[index].listener == listener) {
                            handlerPairs.splice(index, 1);
                            break;
                        }
                    }
                }
            }
        },

        start: function () {

            var timerThis = this;

            if (this.running == true || this.isCompleted) {
                return;
            }

            if (this.handler[TimerEvent.TIMER].length == 0 &&
                this.handler[TimerEvent.TIMER_COMPLETE].length == 0) {
                alert("Timer.start: No Listener");
                return;
            }

            if (this.repeatInfinitely) {
                this.timerId = setInterval(function () {
                    dispatchEvent(TimerEvent.TIMER, timerThis.handler[TimerEvent.TIMER]);
                    timerThis.currentCount++;
                }, this.delay);
            }
            else {
                this.timerId = setTimeout(function () {
                    dispatchAndCheck();
                }, this.delay);
            }

            this.startTime = Date.now();
            this.running = true;


            function dispatchAndCheck() {
                dispatchEvent(TimerEvent.TIMER, timerThis.handler[TimerEvent.TIMER]);
                timerThis.currentCount++;

                if (timerThis.currentCount < timerThis.repeatCount) {
                    if (timerThis.running) {
                        timerThis.timerId = setTimeout(function () {
                            dispatchAndCheck();
                        }, timerThis.delay);
                    }
                }
                else {
                    timerThis.running = false;
                }
                
                if (timerThis.running == false) {
                    if (!timerThis.isCompleted) {
                        dispatchEvent(TimerEvent.TIMER_COMPLETE, timerThis.handler[TimerEvent.TIMER_COMPLETE]);
                        timerThis.isCompleted = true;
                    }
                }
            }

            function dispatchEvent(type, handlerPairs) {

                for (var prop in handlerPairs) {
                    var listener = handlerPairs[prop].listener;
                    var data = handlerPairs[prop].data;
                    if (type == TimerEvent.TIMER) {
                        var timerEvent = new TimerEvent(TimerEvent.TIMER, data);
                        listener(timerEvent);
                    }
                    else if (type == TimerEvent.TIMER_COMPLETE) {
                        var timerCompleteEvent = new TimerEvent(TimerEvent.TIMER_COMPLETE, data);
                        listener(timerCompleteEvent);
                    }
                }

            }

        },

        stop: function () {
            this.running = false;

            if (this.timerId == null || this.timerId == 0) {
                return;
            }

            if (this.repeatInfinitely) {
                clearInterval(this.timerId);
            }
            else {
                clearTimeout(this.timerId);
            }
            this.timerId = 0;

            if (!this.isCompleted) {

                var handlerPairs = this.handler[TimerEvent.TIMER_COMPLETE];

                for (var prop in handlerPairs) {
                    var listener = handlerPairs[prop].listener;
                    var data = handlerPairs[prop].data;
                    var timerCompleteEvent = new TimerEvent(TimerEvent.TIMER_COMPLETE, data);
                    listener(timerCompleteEvent);
                }
            }

            this.isCompleted = true;
        },

        reset: function () {
            this.stop();

            this.currentCount = 0;
            this.isCompleted = false;
            this.startTime = 0;
        },

        getElapsedTime: function () {

            var newTime = Date.now();
            var elapsedTime = newTime - this.startTime;
            if (elapsedTime > this.delay) {
                elapsedTime = this.delay;
            }

            return elapsedTime;
        },

        getRemainingTime: function () {
            var remainingTime = this.delay - this.getElapsedTime();
            return remainingTime;
        }

    });
})();