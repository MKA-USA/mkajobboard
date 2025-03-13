const MKALogo = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="45" fill="#78c197" />
      <circle cx="50" cy="50" r="40" fill="white" />
      <path 
        d="M50 15 A35 35 0 1 1 15 50 A35 35 0 1 1 50 15" 
        fill="none" 
        stroke="#78c197" 
        strokeWidth="2" 
      />
      <text 
        x="50" 
        y="45" 
        fontFamily="Arial" 
        fontSize="14" 
        fontWeight="bold" 
        textAnchor="middle" 
        fill="#78c197"
      >
        MKA
      </text>
      <text 
        x="50" 
        y="60" 
        fontFamily="Arial" 
        fontSize="12" 
        textAnchor="middle" 
        fill="#78c197"
      >
        USA
      </text>
    </svg>
  );
};

export default MKALogo;
