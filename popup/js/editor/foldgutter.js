!function (t) { "object" == typeof exports && "object" == typeof module ? t(require("../../lib/codemirror"), require("./foldcode")) : "function" == typeof define && define.amd ? define(["../../lib/codemirror", "./foldcode"], t) : t(CodeMirror) }(function (n) { "use strict"; n.defineOption("foldGutter", !1, function (t, o, e) { e && e != n.Init && (t.clearGutter(t.state.foldGutter.options.gutter), t.state.foldGutter = null, t.off("gutterClick", d), t.off("changes", u), t.off("viewportChange", l), t.off("fold", m), t.off("unfold", m), t.off("swapDoc", u), t.off("optionChange", a)), o && (t.state.foldGutter = new r(function (t) { !0 === t && (t = {}); null == t.gutter && (t.gutter = "CodeMirror-foldgutter"); null == t.indicatorOpen && (t.indicatorOpen = "CodeMirror-foldgutter-open"); null == t.indicatorFolded && (t.indicatorFolded = "CodeMirror-foldgutter-folded"); return t }(o)), f(t), t.on("gutterClick", d), t.on("changes", u), t.on("viewportChange", l), t.on("fold", m), t.on("unfold", m), t.on("swapDoc", u), t.on("optionChange", a)) }); var c = n.Pos; function r(t) { this.options = t, this.from = this.to = 0 } function s(t, o) { for (var e = t.findMarks(c(o, 0), c(o + 1, 0)), n = 0; n < e.length; ++n)if (e[n].__isFold) { var r = e[n].find(-1); if (r && r.line === o) return e[n] } } function p(t) { var o; return "string" == typeof t ? ((o = document.createElement("div")).className = t + " CodeMirror-guttermarker-subtle", o) : t.cloneNode(!0) } function i(r, t, o) { var i = r.state.foldGutter.options, f = t - 1, d = r.foldOption(i, "minFoldSize"), a = r.foldOption(i, "rangeFinder"), u = "string" == typeof i.indicatorFolded && e(i.indicatorFolded), l = "string" == typeof i.indicatorOpen && e(i.indicatorOpen); r.eachLine(t, o, function (t) { ++f; var o = null, e = (e = t.gutterMarkers) && e[i.gutter]; if (s(r, f)) { if (u && e && u.test(e.className)) return; o = p(i.indicatorFolded) } else { var n = c(f, 0), n = a && a(r, n); if (n && n.to.line - n.from.line >= d) { if (l && e && l.test(e.className)) return; o = p(i.indicatorOpen) } } (o || e) && r.setGutterMarker(t, i.gutter, o) }) } function e(t) { return new RegExp("(^|\\s)" + t + "(?:$|\\s)\\s*") } function f(t) { var o = t.getViewport(), e = t.state.foldGutter; e && (t.operation(function () { i(t, o.from, o.to) }), e.from = o.from, e.to = o.to) } function d(t, o, e) { var n = t.state.foldGutter; !n || e == (e = n.options).gutter && ((n = s(t, o)) ? n.clear() : t.foldCode(c(o, 0), e)) } function a(t, o) { "mode" == o && u(t) } function u(t) { var o, e = t.state.foldGutter; e && (o = e.options, e.from = e.to = 0, clearTimeout(e.changeUpdate), e.changeUpdate = setTimeout(function () { f(t) }, o.foldOnChangeTimeSpan || 600)) } function l(o) { var t, e = o.state.foldGutter; e && (t = e.options, clearTimeout(e.changeUpdate), e.changeUpdate = setTimeout(function () { var t = o.getViewport(); e.from == e.to || 20 < t.from - e.to || 20 < e.from - t.to ? f(o) : o.operation(function () { t.from < e.from && (i(o, t.from, e.from), e.from = t.from), t.to > e.to && (i(o, e.to, t.to), e.to = t.to) }) }, t.updateViewportTimeSpan || 400)) } function m(t, o) { var e = t.state.foldGutter; !e || (o = o.line) >= e.from && o < e.to && i(t, o, o + 1) } });