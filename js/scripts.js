// ================== CONFIG ==================
const API_URL = "https://script.google.com/macros/s/AKfycbyaw3r_Wm5iZQFRvPM3nkasp-klvdioTGeouAq2t5p4JhZbT0Xv4pcyyxic7ORHpVFGdw/exec"

// ================== HEADER ==================
const header = document.querySelector("header")

const seccionTitulo = document.createElement("section")
seccionTitulo.className = "titulo"
header.appendChild(seccionTitulo)

const h1 = document.createElement("h1")
h1.innerText = "Comandos Git para siempre"
seccionTitulo.appendChild(h1)

const subtitulo = document.createElement("p")
subtitulo.className = "subtitulo"
subtitulo.innerText = "Guardá tus snippets de Git, con categorías, tags y botón copiar."
seccionTitulo.appendChild(subtitulo)

// ================== MAIN ==================
const main = document.querySelector("main")

// ------- Sección agregar -------
const seccionAgregar = document.createElement("section")
seccionAgregar.className = "agregar"
main.appendChild(seccionAgregar)

const form = document.createElement("form")
form.className = "form-grid"
seccionAgregar.appendChild(form)

// Categoria
const labelCat = document.createElement("label")
labelCat.innerText = "Categoría (opcional)"
labelCat.htmlFor = "categoria"
form.appendChild(labelCat)

const inputCat = document.createElement("input")
inputCat.id = "categoria"
inputCat.type = "text"
inputCat.placeholder = "Ej: Ramas / Merge / Diagnóstico"
form.appendChild(inputCat)

// Titulo
const labelTit = document.createElement("label")
labelTit.innerText = "Título *"
labelTit.htmlFor = "titulo"
form.appendChild(labelTit)

const inputTit = document.createElement("input")
inputTit.id = "titulo"
inputTit.type = "text"
inputTit.placeholder = "Ej: Ver repos remotos"
form.appendChild(inputTit)

// Tags
const labelTags = document.createElement("label")
labelTags.innerText = "Tags (opcional)"
labelTags.htmlFor = "tags"
form.appendChild(labelTags)

const inputTags = document.createElement("input")
inputTags.id = "tags"
inputTags.type = "text"
inputTags.placeholder = "Ej: git, remoto, origin"
form.appendChild(inputTags)

// Comando
const labelCmd = document.createElement("label")
labelCmd.innerText = "Comando *"
labelCmd.htmlFor = "comando"
form.appendChild(labelCmd)

const textareaCmd = document.createElement("textarea")
textareaCmd.id = "comando"
textareaCmd.rows = 3
textareaCmd.placeholder = "Ej: git remote -v"
form.appendChild(textareaCmd)

// Explicacion
const labelExp = document.createElement("label")
labelExp.innerText = "Explicación (opcional)"
labelExp.htmlFor = "explicacion"
form.appendChild(labelExp)

const textareaExp = document.createElement("textarea")
textareaExp.id = "explicacion"
textareaExp.rows = 3
textareaExp.placeholder = "Ej: Muestra todas las URLs remotas configuradas."
form.appendChild(textareaExp)

// Acciones
const acciones = document.createElement("div")
acciones.className = "acciones"
form.appendChild(acciones)

const btnAgregar = document.createElement("button")
btnAgregar.type = "submit"
btnAgregar.className = "btn-primary"
btnAgregar.innerText = "Guardar comando"
acciones.appendChild(btnAgregar)

const btnLimpiar = document.createElement("button")
btnLimpiar.type = "button"
btnLimpiar.className = "btn-ghost"
btnLimpiar.innerText = "Limpiar"
acciones.appendChild(btnLimpiar)

// ------- Barra de búsqueda -------
const barra = document.createElement("section")
barra.className = "barra"
main.appendChild(barra)

const inputBuscar = document.createElement("input")
inputBuscar.type = "search"
inputBuscar.placeholder = "Buscar por título, comando, categoría o tags…"
inputBuscar.className = "buscar"
barra.appendChild(inputBuscar)

const contador = document.createElement("div")
contador.className = "contador"
contador.innerText = "0 comandos"
barra.appendChild(contador)

// ------- Mural -------
const mural = document.createElement("section")
mural.className = "mural"
main.appendChild(mural)

// ================== STATE ==================
let comandosCache = []

// ================== API ==================
async function cargarComandos() {
  try {
    const resp = await fetch(API_URL)
    const data = await resp.json()
    comandosCache = Array.isArray(data) ? data : []
    render(comandosCache)
  } catch (err) {
    console.error("Error al cargar comandos", err)
    mural.innerHTML = `<p class="error">No se pudieron cargar los comandos. Revisá la URL del Apps Script.</p>`
  }
}

async function agregarComandoAPI(item) {
  const url = API_URL
    + "?modo=add"
    + "&categoria=" + encodeURIComponent(item.categoria)
    + "&titulo=" + encodeURIComponent(item.titulo)
    + "&comando=" + encodeURIComponent(item.comando)
    + "&explicacion=" + encodeURIComponent(item.explicacion)
    + "&tags=" + encodeURIComponent(item.tags)

  await fetch(url)
}

// ================== RENDER ==================
function render(lista) {
  mural.innerHTML = ""

  contador.innerText = `${lista.length} comando${lista.length === 1 ? "" : "s"}`

  lista.forEach((it) => {
    const card = document.createElement("article")
    card.className = "card"

    // header card
    const top = document.createElement("div")
    top.className = "card-top"
    card.appendChild(top)

    const left = document.createElement("div")
    left.className = "card-left"
    top.appendChild(left)

    const titulo = document.createElement("h2")
    titulo.innerText = it.titulo || "(sin título)"
    left.appendChild(titulo)

    const meta = document.createElement("div")
    meta.className = "meta"
    left.appendChild(meta)

    if (it.categoria) {
      const chipCat = document.createElement("span")
      chipCat.className = "chip"
      chipCat.innerText = it.categoria
      meta.appendChild(chipCat)
    }

    if (it.tags) {
      const chipTags = document.createElement("span")
      chipTags.className = "chip chip-soft"
      chipTags.innerText = it.tags
      meta.appendChild(chipTags)
    }

    const right = document.createElement("div")
    right.className = "card-right"
    top.appendChild(right)

    const btnCopiar = document.createElement("button")
    btnCopiar.className = "btn-copy"
    btnCopiar.type = "button"
    btnCopiar.innerText = "Copiar"
    right.appendChild(btnCopiar)

    // comando (code)
    const pre = document.createElement("pre")
    pre.className = "code"
    const code = document.createElement("code")
    code.innerText = it.comando || ""
    pre.appendChild(code)
    card.appendChild(pre)

    // explicacion
    if (it.explicacion) {
      const p = document.createElement("p")
      p.className = "exp"
      p.innerText = it.explicacion
      card.appendChild(p)
    }

    // fecha
    if (it.timestamp) {
      const fecha = new Date(it.timestamp)
      const small = document.createElement("div")
      small.className = "fecha"
      small.innerText = isNaN(fecha.getTime())
        ? ""
        : fecha.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
      card.appendChild(small)
    }

    // evento copiar
    btnCopiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(it.comando || "")
        btnCopiar.innerText = "Copiado ✓"
        setTimeout(() => (btnCopiar.innerText = "Copiar"), 900)
      } catch (e) {
        console.error("No se pudo copiar", e)
        btnCopiar.innerText = "Error"
        setTimeout(() => (btnCopiar.innerText = "Copiar"), 900)
      }
    })

    mural.appendChild(card)
  })
}

function filtrar(texto) {
  const q = (texto || "").toLowerCase().trim()
  if (!q) return comandosCache

  return comandosCache.filter((it) => {
    const blob = [
      it.categoria,
      it.titulo,
      it.comando,
      it.explicacion,
      it.tags
    ].join(" ").toLowerCase()
    return blob.includes(q)
  })
}

// ================== EVENTOS ==================
form.addEventListener("submit", async (e) => {
  e.preventDefault()

  const item = {
    categoria: (inputCat.value || "").trim(),
    titulo: (inputTit.value || "").trim(),
    comando: (textareaCmd.value || "").trim(),
    explicacion: (textareaExp.value || "").trim(),
    tags: (inputTags.value || "").trim(),
  }

  if (!item.titulo || !item.comando) return

  btnAgregar.disabled = true
  btnAgregar.innerText = "Guardando..."

  try {
    await agregarComandoAPI(item)
    inputCat.value = ""
    inputTit.value = ""
    textareaCmd.value = ""
    textareaExp.value = ""
    inputTags.value = ""
    inputTit.focus()
    await cargarComandos()
  } catch (err) {
    console.error("Error al guardar", err)
  } finally {
    btnAgregar.disabled = false
    btnAgregar.innerText = "Guardar comando"
  }
})

btnLimpiar.addEventListener("click", () => {
  inputCat.value = ""
  inputTit.value = ""
  textareaCmd.value = ""
  textareaExp.value = ""
  inputTags.value = ""
  inputTit.focus()
})

inputBuscar.addEventListener("input", (e) => {
  render(filtrar(e.target.value))
})

window.addEventListener("load", cargarComandos)
