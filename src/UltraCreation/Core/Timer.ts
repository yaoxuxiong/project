import {Subject} from 'rxjs/Subject';
import {TypeInfo} from './TypeInfo';

export class Timer extends Subject<any>
{
    constructor(private interval: number,
        private maxCount: number = Infinity,
        private initialDelay = interval)
    {
        super();

        if (interval <= 0)
            interval = 1000;
        if (maxCount <= 0)
            maxCount = 1;
    }

    static startNew(intervalMS: number, maxCount: number = Infinity, initialDelay = intervalMS): Timer
    {
        const newTimer = new Timer(intervalMS, maxCount, initialDelay);
        newTimer.start();
        return newTimer;
    }

    get isRunning(): boolean
    {
        return TypeInfo.Assigned(this.timerCancel);
    }

    start()
    {
        const that = this;
        if (! TypeInfo.Assigned(that.timerCancel) && that._excutedCount < that.maxCount)
        {
            if (that._excutedCount > 0 || that.initialDelay === that.interval)
            {
                const loopTimer = setInterval(Timer.onTick, that.interval, that);
                that.timerCancel = () =>
                {
                    clearInterval(loopTimer);
                };
            }
            else
            {
                const initialTick = setTimeout(Timer.onTick, that.initialDelay, that, true);
                that.timerCancel = () =>
                {
                    clearTimeout(initialTick);
                };
            }
        }
    }

    stop()
    {
        if (TypeInfo.Assigned(this.timerCancel))
        {
            this.timerCancel();
            this.timerCancel = null;
        }
    }

    reset()
    {
        this.stop();
        this._excutedCount = 0;
    }

    updateInterval(intervalMS: number)
    {
        this.interval = intervalMS;
        if (this.isRunning)
        {
            this.stop();
            this.start();
        }
    }

    get excutedCount()
    {
        return this._excutedCount;
    }

    private static onTick(timer: Timer, reinitTimer?: boolean)
    {
        const index = timer._excutedCount++;

        if (reinitTimer)
        {
            timer.stop();
            timer.start();
        }

        if (index < timer.maxCount)
        {
            timer.next(index);
        }
        else
        {
            timer.stop();
            timer.complete();
        }
    }

    private _excutedCount: number = 0;
    private timerCancel: (() => void) | null;
}
