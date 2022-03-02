export const ed = ([...text], ...insert) => {
  const fElements = [];
  let isAttribute = false;
  insert.forEach((item, i) =>
    isAttribute
      ? (Object.keys(item).forEach((attribute) =>
          fElements[fElements.length - 1].element.setAttribute(
            attribute,
            item[attribute]
          )
        ),
        (isAttribute = false))
      : (text[i] += item.outerHTML
          ? "<HTMLPlaceholderTag></HTMLPlaceholderTag>"
          : item instanceof Array
          ? ((insert[i] = e(
              ["<div>", ...new Array(item.length).fill(""), "</div>"],
              ...item
            ).children),
            "<HTMLPlaceholderTag></HTMLPlaceholderTag>")
          : item instanceof Function
          ? ((insert[i] = document.createElement(item.name)),
            fElements.push({
              f: item,
              element: insert[i],
            }),
            text[i + 1] == ":" && (isAttribute = true),
            "<HTMLPlaceholderTag></HTMLPlaceholderTag>")
          : item)
  );
  const full = text.join("");
  const HTMLElements = insert.filter(
    (item) => item instanceof HTMLElement || item instanceof HTMLCollection
  );
  const findRecursive = (element) => {
    [...element.attributes].forEach(
      ({ name, value }) => (element[name] = value)
    );
    if (element.children.length) {
      [...element.children].forEach((child) => findRecursive(child));
    }
    if (element.tagName == "HTMLPLACEHOLDERTAG") {
      [...(HTMLElements[0].attributes || [])].forEach(
        ({ name, value }) => (HTMLElements[0][name] = value)
      );
      if (HTMLElements[0] instanceof HTMLCollection) {
        const fragment = document.createDocumentFragment();
        [...HTMLElements.shift()].forEach((e) => fragment.append(e));
        element.parentNode.replaceChild(fragment, element);
        return;
      }
      element.parentNode.replaceChild(HTMLElements.shift(), element);
    }
  };
  const div = document.createElement("div");
  div.innerHTML = full;
  findRecursive(div);
  fElements.forEach(({ f, element }) => f.apply(element, []));
  return div.children.length - 1 ? div.children : div.children[0];
};

export const eq = ([...text], ...insert) => {
  insert.forEach((item, i) => {
    text[i] = item;
  });
  const elements = document.querySelectorAll(text.join(""));
  return elements.length > 1 ? elements : elements[0];
};

export const eqa = ([...text], ...insert) => {
  insert.forEach((item, i) => {
    text[i] = item;
  });
  return document.querySelectorAll(text.join(""));
};

export const ef = async ([...text], ...insert) => {
  return new Promise(async (resolve, reject) => {
    insert.forEach((item, i) => {
      text[i] = item;
    });
    const url = text.join("");
    let type = url.match(/\.(.+?)$/);
    type = type && type[1];
    if (type.match(/^(ts|js)$/)) return resolve(await import(url));
    const xhr = new XMLHttpRequest();
    xhr.onload = async () => {
      const resType = xhr
        .getResponseHeader("content-type")
        .match(/.+?\/(.+?);/)[1];
      if (resType.match(/^(typescript|javascript)$/))
        return resolve(await import(url));
      if (resType.match(/^(html|svg)$/)) return resolve(ed`${xhr.response}`);
      if (resType == "css") return resolve(ed`<style>${xhr.response}</style>`);
      resolve(xhr.response);
    };
    xhr.open("GET", url);
    xhr.send();
  });
};

export default ([...text], ...insert) => {
  insert.forEach((item, i) => {
    text[i] = item;
  });
  const full = text.join("");
  if (
    full.match(/</) ||
    insert.find(
      (i) =>
        i instanceof HTMLElement ||
        i instanceof HTMLCollection ||
        i instanceof Function
    )
  )
    return ed(text, ...insert);
  if (full.match(/\.(ts|js|json|html|svg|css)$|^https?:\/\//))
    return ef(text, ...insert);
  return eq(text, ...insert);
};
