const UNIT_SECONDS = { "''": 1, '"': 1, s: 1, "'": 60, m: 60, min: 60 };

function tokenize(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '(' || c === ')' || c === '/') { tokens.push({ type: c }); i++; continue; }
    if (c === 'x' || c === 'X' || c === '×') {
      i++;
      while (/\s/.test(text[i])) i++;
      let numStr = '';
      while (/[0-9]/.test(text[i])) { numStr += text[i]; i++; }
      if (!numStr) throw new Error(`Se esperaba un número después de "x" (posición ${i})`);
      tokens.push({ type: 'repeat', value: parseInt(numStr, 10) });
      continue;
    }
    if (/[0-9]/.test(c)) {
      let numStr = '';
      while (/[0-9]/.test(text[i])) { numStr += text[i]; i++; }
      let unit = null;
      if (text[i] === "'" && text[i + 1] === "'") { unit = "''"; i += 2; }
      else if (text.slice(i, i + 3) === 'min') { unit = 'min'; i += 3; }
      else if (text[i] === '"') { unit = '"'; i += 1; }
      else if (text[i] === "'") { unit = "'"; i += 1; }
      else if (text[i] === 's') { unit = 's'; i += 1; }
      else if (text[i] === 'm') { unit = 'm'; i += 1; }
      else throw new Error(`Unidad de tiempo desconocida después de "${numStr}" (posición ${i})`);
      tokens.push({ type: 'duration', value: parseInt(numStr, 10) * UNIT_SECONDS[unit] });
      continue;
    }
    throw new Error(`Carácter inesperado "${c}" (posición ${i})`);
  }
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseSequence(stopAtParen) {
    const children = [];
    while (pos < tokens.length && !(stopAtParen && peek().type === ')')) {
      children.push(parseItem());
    }
    return children;
  }

  function parseItem() {
    let node = parseBase();
    if (peek() && peek().type === 'repeat') {
      const repeat = next().value;
      if (!('repeat' in node)) {
        node = { repeat, children: [node] };
      } else {
        node = { ...node, repeat };
      }
    }
    return node;
  }

  function parseBase() {
    const tok = peek();
    if (!tok) throw new Error('Fin de texto inesperado');

    if (tok.type === '(') {
      next();
      const children = parseSequence(true);
      if (!peek() || peek().type !== ')') throw new Error('Falta un paréntesis de cierre ")"');
      next();
      return { repeat: 1, children };
    }

    if (tok.type === '/') {
      next();
      const d = next();
      if (!d || d.type !== 'duration') throw new Error('Se esperaba una duración después de "/"');
      return { type: 'rest', duration: d.value };
    }

    if (tok.type === 'duration') {
      next();
      if (peek() && peek().type === '/') {
        next();
        const restTok = next();
        if (!restTok || restTok.type !== 'duration') throw new Error('Se esperaba una duración de descanso después de "/"');
        return { repeat: 1, children: [
          { type: 'work', duration: tok.value },
          { type: 'rest', duration: restTok.value }
        ]};
      }
      return { type: 'work', duration: tok.value };
    }

    throw new Error(`Token inesperado: ${JSON.stringify(tok)}`);
  }

  const children = parseSequence(false);
  if (children.length === 0) throw new Error('El texto no describe ningún entreno');
  return { repeat: 1, children };
}

export function parseWorkoutText(text) {
  return parse(tokenize(text));
}
