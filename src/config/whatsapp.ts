const phoneWhats = '528130819678';

export function getWhatsappUrl(contexto: string = 'tu sitio web') {
  const message = `Hola! David!  Vi tu sitio y me interesa mucho tu servicio de desarrollo web`;
  return `https://wa.me/${phoneWhats}?text=${encodeURIComponent(message)}`;
}