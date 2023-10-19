import searchIcon from '../assets/search-white.svg';
const Input = ({
  // destinationRef,
  searchQuery,
  handleInputChange,
  handleSubmit,
  predictions,
  handleSelect,
}) => {
  return (
    <>
      <form className='absolute t-1 l-1 z-10 flex ' onSubmit={handleSubmit}>
        <div>
          <input
            className='py-0 px-5'
            type='text '
            placeholder='Enter location'
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
          />
        </div>
        <ul>
          {predictions.map((prediction) => (
            <li
              key={prediction.place_id}
              onClick={() => handleSelect(prediction)}
            >
              {prediction.description}
            </li>
          ))}
        </ul>
        <button className='py-1 px-1' type='submit'>
          <img src={searchIcon} alt='search-icon' />
        </button>
      </form>
    </>
  );
};

export default Input;
