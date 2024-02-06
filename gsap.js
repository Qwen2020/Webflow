
 // This tween will rotate an element with a class of .my-element
 gsap.to('.line', {
  rotation: 360,
  duration: 2,
  ease: 'bounce.out'
 })

 
gsap.from('[animate-line]', {
    height: 0,
    duration: 2,
    ease: 'bounce.out',
    stagger: 0.5
});