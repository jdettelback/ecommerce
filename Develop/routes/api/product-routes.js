const router = require("express").Router();
const { Product, Category, Tag, ProductTag } = require("../../models");

router.get("/", async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [{ model: Category, model: Tag }],
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get("/:id", async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category, model: Tag }],
    });
    if (!productData) {
      res.status(404).json({ message: "No products found with this id" });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post("/", async (req, res) => {
  try {
    const productData = await Product.create(req.body);
    if (req.body.tagIds) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: productData.id,
          tag_id: tag_id,
        };
      });
      ProductTag.bulkCreate(productTagIdArr);
    }
    res.status(200).json(productData);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.put("/:id", async (req, res) => {
  try {
    Product.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (!req.body.tagIds) {
      res.status(200).json("Product info updated");
      return;
    } else {
      const productTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });
      const productTagIds = productTags.map(({ tag_id }) => tag_id);
      const newProductTags = req.body.tagIds
        .filter((tag_id) => !productTagIds.includes(tag_id))
        .map((tag_id) => {
          return {
            product_id: req.params.id,
            tag_id,
          };
        });
      const productTagsToRemove = productTags
        .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
        .map(({ id }) => id);

      await Promise.all([
        ProductTag.destroy({ where: { id: productTagsToRemove } }),
        ProductTag.bulkCreate(newProductTags),
      ]);
      res.status(200).json("Product information including productTags updated");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const productData = await Product.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (!productData) {
      res.status(404).json({ message: "No products found with this id" });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
