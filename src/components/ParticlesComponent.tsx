const ParticlesComponent = () => {
  return (
    <div id="particles">
      {Array.from({ length: 100 }, (_, index) =>
        <div className="circle-container" key={index}>
          <div className="circle"></div>
        </div>
      )}
    </div>
  )
}

export default ParticlesComponent