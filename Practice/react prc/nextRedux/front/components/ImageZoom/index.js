import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Slick from 'react-slick'
import {Overlay, Global, Header, SlickWrapper, ImgWrapper, CloseBtn, Indicator} from './styles'

const ImageZoom = ({images, onClose}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    return (
    <Overlay>
        <Global/>
        <Header>
            <h1>상세 이미지</h1>
            <CloseBtn onClick={onClose}>X</CloseBtn>
        </Header>
        <SlickWrapper>
            <div>
                <Slick
                    initialSlide={0}
                    beforeChange={(slide)=> setCurrentSlide(slide)}
                    infinite
                    arrows={false}
                    slidesToScroll={1}
                    slidesToShow={1}
                >
                {images.map((v)=>(
                    <ImgWrapper key={v.src}>
                        <img src={`http://localhost:3065/${v.src}`} alt={v.src}/>
                    </ImgWrapper>
                ))}
                </Slick>
                <Indicator>
                    <div>
                        {currentSlide + 1}
                        {'  '}
                        /
                        {'  '}
                        {+ images.length}
                    </div>
                </Indicator>
            </div>
        </SlickWrapper>
    </Overlay>
    )
}

ImageZoom.PropTypes ={
    images : PropTypes.arrayOf(PropTypes.object).isRequired,
    onClose : PropTypes.func.isRequired,
}


export default ImageZoom