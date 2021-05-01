const handleErrors = (error) => {
  if (error.status) console.log('API', error.status);
  throw error;
};

export default handleErrors;
