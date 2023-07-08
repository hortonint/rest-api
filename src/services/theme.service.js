import sanitize from 'mongo-sanitize';
import Theme from '../models/theme.model.js';
import convertImage from '../utils/image.util.js';
import { themeDTO, themesByPageLimitAndSearchQueryDTO } from '../dto/theme.dto.js';

export const getThemesByPageLimitAndSearchQuery = async (page, limit, searchQuery) => {
  const skipDocs = (page - 1) * limit;
  const escapedSearchQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const searchPattern = new RegExp(escapedSearchQuery, 'i');
  const query = Theme.find()
    .select('name themeId')
    .skip(skipDocs)
    .limit(limit);
  const searchQueries = [
    { name: searchPattern },
  ];
  if (searchQuery) {
    query.or(searchQueries);
  }
  const themes = await query;
  const totalThemes = await Theme.countDocuments({
    $or: searchQueries,
  });

  const totalPages = Math.ceil(totalThemes / limit);
  const nextPage = page < totalPages ? page + 1 : null;
  const prevPage = page > 1 ? page - 1 : null;

  return themesByPageLimitAndSearchQueryDTO(
    themes,
    totalThemes,
    totalPages,
    nextPage,
    prevPage,
  );
};

export const getThemeById = async (id) => {
  const theme = await Theme.findOne({ themeId: id })
    .exec();

  if (!theme) {
    throw new Error('Theme not found.');
  }

  return themeDTO(theme);
};

export const createTheme = async (options) => {
  const theme = await new Theme({
    name: options.name,
    color: {},
    align: {},
    display: {},
    logo: {
      size: {},
      format: {},
    },
  }).save();

  if (!theme) {
    throw new Error('Theme not found.');
  }

  return themeDTO(theme);
};

export const updateThemeOptionsById = async (id, options) => {
  if (!options || typeof options !== 'object') {
    throw new Error('Invalid options provided.');
  }

  const {
    logo,
    ...updatedOptions
  } = options;

  const sanitizedLogo = sanitize(logo);
  const sanitizedOptions = sanitize(updatedOptions);

  const update = { ...sanitizedOptions };
  if (sanitizedLogo) {
    update['logo.size'] = sanitizedLogo.size;
  }

  const updatedTheme = await Theme.findOneAndUpdate({ themeId: id }, update, { new: true })
    .exec();

  if (!updatedTheme) {
    throw new Error('Theme not found.');
  }

  return themeDTO(updatedTheme);
};

export const updateThemeLogoById = async (id, image, imageHeight) => {
  try {
    const { format } = await convertImage(image, +imageHeight);

    const sanitizedFormat = sanitize(format);

    const update = {
      'logo.format': sanitizedFormat,
    };

    const sanitizedId = sanitize(id);
    const updatedTheme = await Theme.findOneAndUpdate(
      { themeId: sanitizedId },
      update,
      { new: true },
    )
      .exec();

    if (!updatedTheme) {
      throw new Error('Theme not found.');
    }

    return themeDTO(updatedTheme);
  } catch (err) {
    throw new Error('Error uploading theme image.');
  }
};

export const deleteThemeById = async (id) => Theme.findOneAndDelete({ themeId: { $eq: id } })
  .exec();
