//Nothing new in controllers/index.js. See old examples.

const hostIndex = (req, res) => {
  res.render('index');
};

const notFound = (req, res) => {
  res.status(404).render('notFound', {
    page: req.url,
  });
};

module.exports = {
  index: hostIndex,
  notFound,
};
