import {Component, Input, Output, EventEmitter, ElementRef, AfterContentInit, isDevMode} from '@angular/core';
/**
 *  to get Swiper
 *  npm install swiper -S
 *  npm install @types/swiper -D
 */
import Swiper from 'swiper';
import {TypeInfo} from '../Core/TypeInfo';

@Component({selector: 'swiper',
    template: `<div [ngClass]="{'swiper-container': false}">
        <ng-content></ng-content></div>`,
    styles: [':host {display: block; height: 100%;}', ':host > div {width: 100%; height: 100%; overflow: hidden}']
})
export class SwiperComp implements AfterContentInit
{
    constructor(public Ref: ElementRef)
    {
    }

    ngAfterContentInit()
    {
        this.Wrapper = this.Ref.nativeElement.querySelector('.swiper-wrapper');
        this.Instance = new Swiper(this.Ref.nativeElement.querySelector('swiper > div'), this.Config);
        // console.log(this.Instance);

        this.HookSwiperEvents();
        setTimeout(() => this.OnSlideChanged.emit(this.ActiveIndex));
    }

    Update(): Promise<void>
    {
        if (! this.Updating)
        {
            this.Updating = new Promise<void>((resolve, reject) =>
            {
                setTimeout(() =>
                {
                    this.Instance.update();

                    this.Updating = undefined;
                    resolve();
                });
            });
        }

        return this.Updating;
    }

    get ActiveIndex(): number
    {
        return this.Instance.activeIndex;
    }

    set ActiveIndex(v: number)
    {
        setTimeout(this.SlideTo(v));
    }

    get SlideCount(): number
    {
        if (TypeInfo.Assigned(this.Instance))
            return this.Instance.slides.length;
        else
            return 0;
    }

    SlideTo(Idx: number, Speed?: number, RunCallbacks = true)
    {
        setTimeout(() =>
        {
            if (TypeInfo.Assigned(this.Instance))
                this.Instance.slideTo(Idx, Speed, RunCallbacks);
        });
    }

    SlidePrev(Speed?: number, RunCallbacks = true)
    {
        setTimeout(() =>
        {
            if (TypeInfo.Assigned(this.Instance))
                this.Instance.slidePrev(Speed, RunCallbacks);
        });
    }

    SlideNext(Speed?: number, RunCallbacks = true)
    {
        setTimeout(() =>
        {
            if (TypeInfo.Assigned(this.Instance))
                this.Instance.slideNext(Speed, RunCallbacks);
        });
    }

    Instance: Swiper;
    Wrapper: HTMLElement;

    private Updating: Promise<void> | undefined;
    // private TouchStartIdx: number;

    @Input() Config?: SwiperOptions;
    // onInit(swiper)       function    Callback function, will be executed right after Swiper initialization
    // onDestroy(swiper)    function    Callback function, will be executed when you destroy Swiper
    @Output() OnSlideChanged = new EventEmitter<number>();

    /** 300ms delay */
    @Output() OnClick = new EventEmitter<TouchEvent>();
    /** no delay */
    @Output() OnTap = new EventEmitter<TouchEvent>();
    @Output() OnDoubleTap = new EventEmitter<TouchEvent>();

    @Output() OnImagesReady = new EventEmitter<void>();

    /**  will be executed when Swiper progress is changed, as second arguments it receives progress that is always from 0 to 1 */
    @Output() OnProgress = new EventEmitter<number>();

    @Output() OnReachBeginning = new EventEmitter<void>();
    @Output() OnReachEnd = new EventEmitter<void>();

    /** Same as onSlideChangeStart but caused by autoplay */
    @Output() OnAutoplay = new EventEmitter<void>();
    @Output() OnAutoplayStart = new EventEmitter<void>();
    @Output() OnAutoplayStop = new EventEmitter<void>();

    private HookSwiperEvents()
    {
        /*
        (this.Instance as any).on('slideChangeStart', () => this.OnSlideChangeStart.emit(Inst));
        (this.Instance as any).on('slideNextStart', () => this.OnSlideNextStart.emit(Inst));
        (this.Instance as any).on('slideNextEnd', () => this.OnSlideNextEnd.emit(Inst));
        (this.Instance as any).on('slidePrevStart', () => this.OnSlidePrevStart.emit(Inst));
        (this.Instance as any).on('slidePrevEnd', () => this.OnSlidePrevEnd.emit(Inst));
        (this.Instance as any).on('transitionStart', () => this.OnTransitionStart.emit(Inst));
        (this.Instance as any).on('transitionEnd', () => this.OnTransitionEnd.emit(Inst));

        (this.Instance as any).on('touchStart', (Inst: Swiper, ev: TouchEvent) => this.OnTouchStart.emit({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchMove', (Inst: Swiper, ev: TouchEvent) => this.OnTouchMove.emit({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchMoveOpposite', (Inst: Swiper, ev: TouchEvent) => this.OnTouchMoveOpposite.emit({Inst: Inst, ev: ev}));
        (this.Instance as any).on('slidesMove', (Inst: Swiper, ev: TouchEvent) => this.OnSlidesMove.emit({Inst: Inst, ev: ev}));
        (this.Instance as any).on('touchEnd', (Inst: Swiper, ev: TouchEvent) => this.OnTouchEnd.emit({Inst: Inst, ev: ev}));
        */
        (this.Instance as any).on('slideChange', () =>
        {
            if (isDevMode())
                console.log('Swiper slideChange');

            this.OnSlideChanged.emit(this.ActiveIndex);
        });

        (this.Instance as any).on('click', (ev: TouchEvent) =>
        {
            if (isDevMode())
                console.log('Swiper click');

            this.OnClick.emit(ev);
        });

        (this.Instance as any).on('tap', (ev: TouchEvent) =>
        {
            if (isDevMode())
                console.log('Swiper tap');

            this.OnTap.emit(ev);
        });

        (this.Instance as any).on('doubleTap', (ev: TouchEvent) =>
        {
            if (isDevMode())
                console.log('Swiper doubleTap');

            this.OnDoubleTap.emit(ev);
        });

        (this.Instance as any).on('imagesReady', () =>
        {
            if (isDevMode())
                console.log('Swiper imagesReady');

            this.OnImagesReady.emit();
        });

        (this.Instance as any).on('progress', (Progress: number) =>
        {
            if (isDevMode())
                console.log('Swiper progress');

            this.OnProgress.emit(Progress);
        });

        (this.Instance as any).on('reachBeginning', () =>
        {
            if (isDevMode())
                console.log('Swiper reachBeginning');

            this.OnReachBeginning.emit();
        });

        (this.Instance as any).on('reachEnd', () =>
        {
            if (isDevMode())
                console.log('Swiper reachEnd');

            this.OnReachEnd.emit();
        });

        (this.Instance as any).on('autoplay', () =>
        {
            if (isDevMode())
                console.log('Swiper autoplay');

            this.OnAutoplay.emit();
        });

        (this.Instance as any).on('autoplayStart', () =>
        {
            if (isDevMode())
                console.log('Swiper autoplayStart');

            this.OnAutoplayStart.emit();
        });

        (this.Instance as any).on('autoplayStop', () =>
        {
            if (isDevMode())
                console.log('Swiper autoplayStop');

            this.OnAutoplayStop.emit();
        });
    }
}
