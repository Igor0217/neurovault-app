exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { image, iconNames } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: image
                }
              },
              {
                text: `Analiza esta imagen de texto escrito a mano.
El usuario escribió una lista de nombres de íconos en orden, uno por línea.
Los nombres válidos son: ${iconNames}.
Encuentra esas palabras en la imagen (ignora mayúsculas, tildes y errores leves).
Responde en UNA SOLA LÍNEA con los nombres encontrados separados por coma, en el orden en que aparecen.
Sin explicaciones, sin puntos. Ejemplo: escudo, llave, luna`
              }
            ]
          }],
          generationConfig: { maxOutputTokens: 100, temperature: 0 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: text.trim() })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
