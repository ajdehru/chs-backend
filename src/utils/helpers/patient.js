const calculateAge = (dob) => {
  const birthDateObj = new Date(dob);
  const today = new Date();

  let years = today.getFullYear() - birthDateObj.getFullYear();
  let months = today.getMonth() - birthDateObj.getMonth();

  // Adjust for cases where the current month is earlier than the birth month
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months: months.toString().padStart(2, "0") };
};

module.exports = {
  calculateAge,
};
