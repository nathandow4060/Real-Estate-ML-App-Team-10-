import Swiper from 'swiper'
import { Navigation, Pagination } from 'swiper/modules';
import { useEffect } from 'react';
import 'swiper/swiper.css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import './style/carouselStyle.css'


function Carousel() {

    const swiper = new Swiper('.swiper', {
        pagination: {
            el: '.swiper-pagination'
        },
        navigation: {
            nextEl:'.swiper-button-next',
            prevEl:'.swiper-button-prev',
        },
        scrollbar: {
            el: '.swiper-scrollbar',
        },
        modules: [Navigation,Pagination]
    })
    
    useEffect(() => {

    
      return () => {
        
      }
    }, [])


    return (
    <>
        <div className="swiper">
            <div className="swiper-wraper">
                <div className="swiper-slide"></div>
                <div className="swiper-slide"></div>
                <div className="swiper-slide"></div>
            </div>
            <div className="swiper-pagination"></div>
            <div className="swiper-button-prev"></div>
            <div className="swiper-button-next"></div>
            <div className="swiper-scrollbar"></div>
        </div>
    </>)
}

export default Carousel;