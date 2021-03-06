var fields = {
	arr: {},
	mode: false, // false - form not open, 0 - add, id - edit
	el: {
		parent: $('#fields')
	},
	init: function(callback)
	{
		var x = this;

		x.el.list = $('.list', x.el.parent);
		x.el.overlay = $('.overlay', x.el.parent);
		x.el.form = $('.form', x.el.parent);

		x.template = {};

		$.getJSON('?fields/get', function(json){
			x.arr.groups = $.isArray(json.groups) ? {} : json.groups;
			x.arr.fields = $.isArray(json.fields) ? {} : json.fields;
			x.arr.groups['#'] = {childs: []};
			x.arr.fields['#'] = {childs: []};

			$.each(sorting.arr['fields_groups'], function(i, el){
				if (el && x.arr.groups[el.id] && x.arr.groups[el.parent]) {
					x.arr.groups[el.id].parent = el.parent;
					x.arr.groups[el.parent].childs.push(+el.id);
				}
			});
			$.each(sorting.arr['fields'], function(i, el){
				if (el && x.arr.fields[el.id] && x.arr.fields[el.parent]) {
					x.arr.fields[el.id].parent = el.parent;
					x.arr.fields[el.parent].childs.push(+el.id);
				}
			});
			$.each(x.arr.groups, function(i, el){
				if (i != '#' && !el.parent) {
					x.arr.groups[i].parent = '#';
					x.arr.groups['#'].childs.push(i);
				}
			});
			$.each(x.arr.fields, function(i, el){
				if (i != '#' && !el.parent) {
					x.arr.fields[i].parent = '#';
					x.arr.fields['#'].childs.push(i);
				}
			});

			callback();
		});
	},
	start: function()
	{
		var x = this;
		if (x.started) {x.reset(); return false;}
		x.started = true;

		x.draw();

		x.handlers();
		common.resize();
	},
	handlers: function()
	{
		var x = this;

		x.el.list.on('click', '.header .create', function(){
			var th = $(this);
			var parent = th.parents('.items');
			x.parent = parent.attr('parent');

			x.add();
		}).on('click', '.remove', function(){
			var th = $(this).parent();
			x.parent = th.parents('.items').attr('parent');
			x.remove(th);

			return false;
		}).on('click', '.item', function(){
			var th = $(this);
			var id = +th.attr('data');
			x.parent = th.parents('.items').attr('parent');
			x.edit(id);
		});

		x.reset();
	},
	sortable: function()
	{
		var x = this;

		var sort = function(parent, ids){
			x.arr[parent]['#'].childs = ids;
			$.each(ids, function(i, id){
				x.arr[parent][id].parent = '#';
			});

			x.sorting();
		};

		$('.overview', x.el.list).sortable({
			appendTo: x.el.list,
			helper: 'clone',
			items: '.item',
			update: function(e, ui){
				var parent = ui.item.parents('.items');

				var id_parent = parent.attr('parent');
				var id_items = $('.item', parent).map(function(){
					return +$(this).attr('data');
				}).get();

				sort(id_parent, id_items);
			}
		});
	},
	draw: function()
	{
		var x = this;

		var html = '';
		$.each(x.arr, function(key, val){
			var title = key == 'groups' ? lang['fields_l_head_groups'] : lang['fields_l_head_fields'];
			var child = $.map(val['#'].childs, function(id){
				if (id && val[id]) {
					return '<div class="item br3 animate" data="' + id + '">\
						<p class="remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg></p>\
						<p class="title">' + (key === 'groups' ? val[id].title : val[id].private_title) + '</p>\
					</div>';
				}
			});
			child = child.length ? child.join('') : '<div class="empty">' + lang['global_empty'] + '</div>';

			html += '<div class="items animate2 box" parent="' + key + '">\
				<div class="header">\
					<div class="br3 animate create">' + (key == 'groups' ? lang['fields_l_head_create_groups'] : lang['fields_l_head_create_fields']) + '</div>\
					<div class="title">' + title + '</div>\
				</div>\
				<div class="scroll">\
					<div class="viewport"><div class="overview">' + child + '</div></div>\
					<div class="scrollbar animate"><div class="track"><div class="thumb"></div></div></div>\
				</div>\
			</div>';
		});
		x.el.list.html(html).find('.scroll').tinyscrollbar();
		x.sortable();

		common.resize();
	},
	add: function(id)
	{
		var x = this;

		x.mode = 0;

		var title = '';
		if (x.parent === 'groups') {
			if (id) {
				title = vsprintf(lang['fields_edit_group'], [x.arr[x.parent][id].title]);
			} else {
				title = lang['fields_create_group'];
			}
		} else {
			if (id) {
				title = vsprintf(lang['fields_edit_field'], [x.arr[x.parent][id].private_title]);
			} else {
				title = lang['fields_create_field'];
			}
		}

		var childs = '';
		if (x.parent === 'fields') {
			childs += '<div class="container system">\
				<label class="field box left text">\
					<div class="head"><p>' + lang['fields_input_title'] + '</p></div>\
					<div class="group">\
						<input id="title" class="br3 box animate1" type="text" value="">\
					</div>\
				</label>\
				<label class="field box right text">\
					<div class="head"><p>' + lang['fields_input_public_title'] + '</p></div>\
					<div class="group">\
						<input id="public_title" class="br3 box animate1" type="text" value="">\
					</div>\
				</label>\
				<div class="clr"></div>\
			</div>\
			<div class="container system"><div class="field select">\
				<div class="head"><p>' + lang['fields_input_type'] + '</p></div>\
				<div class="group">\
					' + $.map(fields.types, function(v, k){
						return '<p class="br3 animate1" data="' + k + '" title="' + v.description + '">' + v.title + '</p>';
					}).join('') + '\
					<div class="clr"></div>\
				</div>\
			</div></div>';
		} else {
			childs += '<div class="container system"><label class="field text">\
				<div class="head"><p>' + lang['fields_input_title'] + '</p></div>\
				<div class="group">\
					<input id="title" class="br3 box animate1" type="text" value="">\
				</div>\
			</label></div>\
			<div class="container system"><div class="field checkbox">\
				<div class="head"><p>' + lang['fields_input_fields'] + '</p></div>\
				<div class="group">\
					' + $.map(x.arr.fields['#'].childs, function(id, k){
						if (id && x.arr.fields[id]) return '<p data="' + id + '" class="br3 animate1">' + x.arr.fields[id].private_title + '</p>';
					}).join('') + '\
					<div class="clr"></div>\
				</div>\
			</div></div>';
			childs += '<div class="switches">\
				<div class="switch desc">' + ui.switch.html() + '</div>\
				<div class="switch image">' + ui.switch.html() + '</div>\
			</div>';
		}

		var html = '<div class="header">\
			<div class="actions">\
				<div class="br3 save">' + lang['global_save'] + '</div>\
				<div class="br3 saveclose">' + lang['global_save_and_close'] + '</div>\
				<div class="br3 close">' + lang['global_close'] + '</div>\
			</div>\
			<div class="title">' + title + '</div>\
		</div>\
		<div class="wrapper">' + childs + '</div>';
		x.el.form.html(html);

		x.el.form.find('.header').on('click', '.close', function(){
			x.mode = false;
			x.el.overlay.removeClass('show');
			x.el.form.removeClass('show');
			common.resize();
		}).on('click', '.saveclose', function(){
			x.save(true);
		}).on('click', '.save', function(){
			x.save();
		});

		var checkbox = $('.field.checkbox', x.el.form);
		if (x.parent == 'fields') {
			$('#title', x.el.form).blur(function(){
				var val = $(this).val().trim();
				var public_title = $('#public_title', x.el.form);
				var public_title_val = public_title.val().trim();
				if (!public_title_val) public_title.val(val);
			});
		} else {
			checkbox.sortable({items: 'p', tolerance: 'pointer'});
		}

		checkbox.on('click', 'p', function(){
			var th = $(this);

			th.toggleClass('active');
		});
		$('.field.select', x.el.form).on('click', 'p', function(){
			var th = $(this);

			th.addClass('active').siblings().removeClass('active');

			var type = th.attr('data');
			var parent = $('.field.select', x.el.form).parent();
			parent.nextAll().remove();
			x.types[type].attr_add(parent);
		});

		if (!id) {
			var sw_desc = $('.switch.desc .ui-switch', x.el.form);
			var sw_image = $('.switch.image .ui-switch', x.el.form);

			ui.switch.init(sw_desc, {
				status: false,
				change: function(status){},
				text: lang['fields_group_sw_desc']
			});
			ui.switch.init(sw_image, {
				status: false,
				change: function(status){},
				text: lang['fields_group_sw_image']
			});
		}

		x.el.overlay.addClass('show');
		x.el.form.addClass('show');
	},
	edit: function(id)
	{
		var x = this;

		x.add(id);
		x.mode = id;

		var arr = x.arr[x.parent][id];

		if (x.parent === 'groups') {
			var settings = $.parseJSON(arr.settings);

			$('#title', x.el.form).val(arr.title);
			$.each(settings.fields, function(i, id){
				if (id) $('.field.checkbox p[data="' + id + '"]', x.el.form).addClass('active');
			});

			var sw_desc = $('.switch.desc .ui-switch', x.el.form);
			var sw_image = $('.switch.image .ui-switch', x.el.form);

			ui.switch.init(sw_desc, {
				status: settings.show_desc,
				change: function(status){},
				text: lang['fields_group_sw_desc']
			});
			ui.switch.init(sw_image, {
				status: settings.show_image,
				change: function(status){},
				text: lang['fields_group_sw_image']
			});
		} else {
			$('#title', x.el.form).val(arr.private_title);
			$('#public_title', x.el.form).val(arr.public_title);
			$('.field.select p[data="' + arr.type + '"]', x.el.form).click();
			fields.types[arr.type].attr_edit(arr.value);
		}
	},
	save: function(close)
	{
		var x = this;

		loader.show();

		var data = {};
		if (x.mode) data.id = x.mode;

		if (x.parent === 'groups') {
			data.title = $('#title', x.el.form).val().trim();
			data.settings = {
				fields: $('.field.checkbox p.active', x.el.form).map(function(){
					return +$(this).attr('data');
				}).get(),
				show_desc: ui.switch.get($('.switch.desc .ui-switch', x.el.form)),
				show_image: ui.switch.get($('.switch.image .ui-switch', x.el.form))
			};
			data.settings = JSON.stringify(data.settings);
		} else {
			data.type = $('.field.select p.active', x.el.form).attr('data');
			if (!data.type) {
				alertify.error(lang['fields_error_type']);
				loader.hide();
				return false;
			}

			data.value = x.types[data.type].attr_save();

			data.private_title = $('#title', x.el.form).val().trim();
			data.public_title = $('#public_title', x.el.form).val().trim();
		}

		var url = '?' + (x.parent == 'groups' ? 'fields_groups' : 'fields') + '/' + (x.mode ? 'edit' : 'add');
		$.post(url, data, function(json){
			if (json.status === 'OK') {
				if (x.mode) {
					$.extend(x.arr[x.parent][x.mode], data);
					loader.hide();
				} else {
					var id = +json.id;
					x.mode = data.id = id;
					data.parent = '#';
					x.arr[x.parent][id] = data;
					x.arr[x.parent]['#'].childs.push(id);
					x.sorting();
				}

				if (close) {
					x.mode = false;
					x.el.overlay.removeClass('show');
					x.el.form.removeClass('show');
					common.resize();
				}

				x.draw();
			} else {
				m.report(url, data, JSON.stringify(json));
				loader.hide();
			}
		}, 'json');
	},
	remove: function(el)
	{
		var x = this;

		var id = +el.addClass('removed').attr('data');

		alertify.confirm(lang['fields_remove'], function(e){
			if (e) {
				loader.show();

				$.post('?fields/' + x.parent + '_remove', {id: id}, function(){
					delete x.arr[x.parent][id];

					x.draw();
					x.sorting();
				}, 'json');
			} else {
				el.removeClass('removed');
			}
		});
	},
	sorting: function()
	{
		var x = this;

		var sort_groups = $.map(x.arr.groups['#'].childs, function(el){
			if (el && x.arr.groups[el]) return {id: el, parent: '#'};
		});

		var sort_fields = $.map(x.arr.fields['#'].childs, function(el){
			if (el && x.arr.fields[el]) return {id: el, parent: '#'};
		});

		sorting.set('fields_groups', sort_groups);
		sorting.set('fields', sort_fields);
	},
	reset: function()
	{
		var x = this;

		x.el.parent.show().siblings().hide();
		common.resize();
	},
	resize: function()
	{
		var x = this;

		// var w = ww - 80;
		// var elems = $('.items', x.el.list);
		// x.el.form.css({width: x.mode === false ? 0 : w - 240 * Math.min(2, elems.length)});
		// var width = x.mode === false ? Math.max(Math.min(Math.floor(w / elems.length), 500), 300) : 240;
		// var left = Math.min((x.mode === false ? -width * (elems.length - Math.floor(w / width)) : -width * Math.max(Math.max(elems.length, 2) - 2, 0)), 0);
		// x.el.list.css({width: width * elems.length, marginLeft: left});
		// elems.css({width: x.width = width - 1});

		clearTimeout(x.timer); timer = null;
		timer = setTimeout(function(){
			x.el.list.find('.scroll').each(function(){
				$(this).data('plugin_tinyscrollbar').update('relative');
			});
		}, 2000);
	},
	types_attr: {// ADD for multiple_text, checkbox, select
		append_row: function(id, value){
			var x = this;

			var id = id;
			if (!id) {
				id = 0;
				$('.row', x.rows).each(function(){
					id = Math.max(id, +$(this).attr('data'));
				});
				id++;
			}

			var json = $.parseJSON(settings.arr['langFront'] || '{}');

			var row = $('<div data="' + id + '" class="row">\
				<div class="drag">' + icons.drag + '</div>\
				<div class="input br3">' + $.map(json, function(t, l){
					return '<label data="' + l + '">\
						<input class="box br3 animate1" type="text" placeholder="Value">\
						<p title="' + t + '">' + l + '</p>\
					</label>';
				}).join('') + '</div>\
				<div class="remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg></div>\
			</div>');
			$.each(value, function(l, v){
				$('label[data="' + l + '"] input', row).val(v || '');
			});
			x.rows.append(row);
			if (!value) $('input', row).eq(0).focus();

			x.rows.sortable({axis: 'y', items: '.row', handle: '.drag'});
		},
		add: function(parent){
			var x = this;

			x.fields = $('<div class="container system fields"><div class="field">\
				<div class="head"><p>' + lang['fields_types_common_title'] + '</p></div>\
				<div class="group">\
					<div class="add">' + lang['fields_types_common_add'] + '</div>\
					<div class="rows"></div>\
				</div>\
			</div></div>').insertAfter(parent);
			x.rows = $('.rows', x.fields);

			x.fields.on('click', '.add', function(){
				x.append_row();
			}).on('click', '.remove', function(){
				$(this).parent().remove();
			});

			x.append_row();
		},
		edit: function(elems){
			var x = this;

			var elems = $.parseJSON(elems || '{}');
			var arr = {};
			x.rows.empty();

			$.each(elems, function(i, el){
				$.each(el, function(k, v){
					if (!arr[k]) arr[k] = {};
					arr[k][i] = v;
				});
			});

			$.each(arr, function(id, value){
				x.append_row(id, value);
			});
		},
		save: function(){
			var x = this;

			var json = {};

			$('.row', x.rows).each(function(){
				var th = $(this);
				var id = +th.attr('data');

				$('label', th).each(function(){
					var th = $(this);
					var lang = th.attr('data');
					var val = $('input', th).val().trim();

					if (!json[lang]) json[lang] = {};
					json[lang][id] = val;
				});
			});

			return JSON.stringify(json);
		}
	},
	types: {
		text: {
			title: lang['fields_types_text_title'],
			description: lang['fields_types_text_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				var val = value ? String(value) : '';
				$('<input type="text" class="br3 box animate1" value="">').val(val).appendTo(parent);
			},
			item_save: function(parent){
				return $('input', parent).val().trim();
			},
			bases: {
				view: function(str){
					var str = str || '';
					return str.short(100);
				},
				sort: function(str){
					return str;
				}
			}
		},
		multiple_text: {
			title: lang['fields_types_multiple_text_title'],
			description: lang['fields_types_multiple_text_desc'],
			attr_add: function(parent){
				fields.types_attr.add(parent);
			},
			attr_edit: function(elems){
				fields.types_attr.edit(elems);
			},
			attr_save: function(){
				return fields.types_attr.save();
			},
			item_add: function(parent, value, elems, section, lang_active){
				var section = section || 'items';
				var lang_active = lang_active || window[section].lang_active;

				var lang_save = {};
				var elems = $.parseJSON(elems || '{}');

				$.each(elems, function(i, el){
					lang_save[i] = el;
				});
				lang_save = lang_save[lang_active];

				var values = {};
				var value = value ? value.split('~;~') : [];
				$.each(value, function(i, val){
					var val = val.split('~:~');
					values[val[0]] = val[1].replace(/~\^~/g, '"') || '';
				});
				$.each(lang_save, function(id, ph){
					$('<input type="text" class="br3 box animate1" data="' + id + '" value="">').val(values[id]).attr('placeholder', ph).appendTo(parent);
				});
			},
			item_save: function(parent){
				return $('input', parent).map(function(){
					var th = $(this);
					var arr = [th.attr('data'), th.val().trim().replace(/"|&quot;/g, '~^~')];
					return arr.join('~:~');
				}).get().join('~;~');
			},
			bases: {
				view: function(str){
					return '<ul>' + $.map(str.split('~;~'), function(s){
						var s = s.split('~:~');
						if (s[1]) return '<li>' + s[1].short(10) + '</li>';
					}).join('') + '</ul>';
				},
				sort: function(str){
					return $.map(str.split('~;~'), function(s, i){
						var s = s.split('~:~');
						if (s[1]) return s[1];
					}).join('');
				}
			}
		},
		textarea: {
			title: 'Textarea',
			description: 'Textarea field',
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				var val = value ? String(value).replace(/~\^~/g, '"') : '';
				$('<textarea class="br3 box animate1" rows="5" />').val(val).appendTo(parent);
			},
			item_save: function(parent){
				return $('textarea', parent).val().trim().replace(/"|&quot;/g, '~^~');
			},
			bases: {
				view: function(str){
					var str = str || '';
					return str.short(100);
				},
				sort: function(str){
					return str;
				}
			}
		},
		tinymce: {
			title: lang['fields_types_tinymce_title'],
			description: lang['fields_types_tinymce_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value, elems, section){
				var section = section || 'items';

				// Раньше при сохранении двойные кавычки заменялись на ~^~
				// для того, чтобы парсинг работал. Например {"1":"1~^~2"}
				// Теперь кавычки экранируются самим TinyMCE {"1":"1\"2"}
				// но обратная замена нужна для старых версий.
				// TODO: исправить в базе во всех tinymce полях (desc, fields[]) ~^~ на \"
				var val = value ? String(value).replace(/~\^~/g, '"') : '';
				var textarea = $('<textarea />').val(val).appendTo(parent);

				tinymce.init({
					target: textarea.get(0),
					init_instance_callback: function(){},
					plugins: 'print code image link media table lists autoresize contextmenu paste',
					// plugin image
					// https://www.tiny.cloud/docs/plugins/image/
					// image_list: $.map(files.arr.files, function(el, i){
						// return {title: '/qrs/getfile/' + el.title, value: i};
					// }).reverse(),
					image_advtab: true,
					file_picker_callback: function(callback, value, meta){
						files.openFiles = 1;
						files.openFilesSelected = [];
						files.start();

						files.el.list.css({zIndex: 99999, background: '#f8f8f8'});
						common.el.header.css({zIndex: 99999});

						$('.f.selected', files.el.list).removeClass('selected');

						var close = function(){
							actions.remove();

							window[section].reset();
							files.openFiles = false;
							$('.f.selected', files.el.list).removeClass('selected');

							files.el.list.removeAttr('style');
							common.el.header.removeAttr('style');
						};
						var actions = $('<div class="actions" />');
						var btn_back = $('<div class="back br3">' + lang['fields_types_file_back'] + '</div>').on('click', function(){
							callback('');
							close();
						});
						var btn_save = $('<div class="save br3">' + lang['fields_types_file_save'] + '</div>').on('click', function(){
							if (!files.openFilesSelected.length) {
								alertify.error(lang['fields_types_file_error_not_selected']);
								return false;
							}
							var id = files.openFilesSelected[0];
							callback('/qrs/getfile/' + id, {alt: files.arr.files[id].title});
							close();
						});
						actions.append(btn_save, btn_back);
						common.el.header.append(actions);
					},
					// plugin autoresize
					resize: false,
					autoresize_bottom_margin: 3,
					autoresize_overflow_padding: 20,
					autoresize_min_height: 75,
					// plugin link
					default_link_target: '_blank',
					paste_as_text: true,
					convert_urls: false,
					// relative_urls: false,
					// document_base_url: location.origin + '/',
					// remove_script_host: false,
					// entity_encoding: 'raw',
					menubar: false,
					toolbar: 'print | undo redo | formatselect | fontsizeselect | bold italic underline strikethrough | superscript subscript | align | numlist bullist outdent indent | removeformat | link image media | code',
					contextmenu: 'link image inserttable | cell row column deletetable',
					elementpath: false,
					branding: false,
					statusbar: false,
					content_style: 'img {max-width:100%;height:auto;display:block;}',
					fontsize_formats: '8pt 9pt 10pt 11pt 12pt 13pt 14pt 15pt 16pt 17pt 18pt 24pt 36pt',
					// setup: function(editor){
						// editor.on('change', function(){});
					// }
				});
			},
			item_save: function(parent){
				var id = $('textarea', parent).attr('id');
				return tinyMCE.editors[id].getContent().trim().replace(/\n/g, '');
			},
			bases: {
				view: function(str){
					var str = str || '';
					return str.replace(/<[^>]+>/g, '').short(100);
				},
				sort: function(str){
					return str.replace(/<[^>]+>/g, '');
				}
			}
		},
		checkbox: {
			title: lang['fields_types_checkbox_title'],
			description: lang['fields_types_checkbox_desc'],
			attr_add: function(parent){
				fields.types_attr.add(parent);
			},
			attr_edit: function(elems){
				fields.types_attr.edit(elems);
			},
			attr_save: function(){
				return fields.types_attr.save();
			},
			item_add: function(parent, value, elems, section, lang_active){
				var section = section || 'items';
				var lang_active = lang_active || window[section].lang_active;

				var lang_save = {};
				var elems = $.parseJSON(elems || '{}');

				$.each(elems, function(i, el){
					lang_save[i] = el;
				});
				lang_save = lang_save[lang_active];

				var value = value ? value.split(';') : [];
				parent.append($.map(lang_save, function(el, i){
					var active = $.inArray(i, value) > -1 ? ' active' : '';
					return '<p class="animate1 br3' + active + '" data="' + i + '">' + el + '</p>';
				}).join(''), '<div class="clr"></div>').on('click', 'p', function(){
					$(this).toggleClass('active');
				});
			},
			item_save: function(parent){
				return $('p.active', parent).map(function(){
					return $(this).attr('data');
				}).get().join(';');
			},
			bases: {
				view: function(str, id){
					var field = $.parseJSON(fields.arr.fields[id].value || '{}')[settings.arr['langFrontDefault']];
					return $.map(str.split(';'), function(id){
						if (id && field[id]) return field[id];
					}).join(', ').short(100, ',');
				},
				sort: function(str, id){
					var field = $.parseJSON(fields.arr.fields[id].value || '{}')[settings.arr['langFrontDefault']];
					return $.map(str.split(';'), function(id){
						if (id && field[id]) return field[id];
					}).join(', ');
				}
			}
		},
		select: {
			title: lang['fields_types_select_title'],
			description: lang['fields_types_select_desc'],
			attr_add: function(parent){
				var x = this;

				x.append_row = function(id, value){
					var x = this;

					var id = id;
					if (!id) {
						id = 0;
						$('.row', x.rows).each(function(){
							id = Math.max(id, +$(this).attr('data'));
						});
						id++;
					}

					var json = $.parseJSON(settings.arr['langFront'] || '{}');

					var row = $('<div data="' + id + '" class="row">\
						<div class="drag">' + icons.drag + '</div>\
						<div class="input br3">\
							<div class="labels">\
								' + $.map(json, function(t, l){
									return '<label data="' + l + '">\
										<input class="box br3 animate1" type="text" placeholder="Value">\
										<p title="' + t + '">' + l + '</p>\
									</label>';
								}).join('') + '\
							</div>\
							<div class="switch default">' + ui.switch.html() + '</div>\
							<div class="switch dependent">' + ui.switch.html() + '</div>\
							<div class="block">\
								<div class="fs show"><div>Show fields</div>' + $.map(fields.arr.fields['#'].childs, function(id){
									var f = fields.arr.fields[id];
									if (!f) return '';
									if (fields.mode === id) return '';
									return '<p class="animate1" data="' + id + '">' + f.public_title + '</p>';
								}).join('') + '</div>\
								<div class="fs hide"><div>Hide fields</div>' + $.map(fields.arr.fields['#'].childs, function(id){
									var f = fields.arr.fields[id];
									if (!f) return '';
									if (fields.mode === id) return '';
									return '<p class="animate1" data="' + id + '">' + f.public_title + '</p>';
								}).join('') + '</div>\
							</div>\
						</div>\
						<div class="remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg></div>\
					</div>');
					x.rows.append(row);
					x.rows.sortable({axis: 'y', items: '.row', handle: '.drag'});

					var s_default = false;
					var s_dependent = false;
					if (value) {
						$.each(value.lang, function(l, v){
							$('label[data="' + l + '"] input', row).val(v || '');
						});
						$.map(value.dependent.show, function(id){
							$('.block .show p[data="' + id + '"]', row).trigger('click');
						});
						$.map(value.dependent.hide, function(id){
							$('.block .hide p[data="' + id + '"]', row).trigger('click');
						});
						s_default = value.default;
						s_dependent = value.dependent.use;
					} else {
						$('input', row).eq(0).focus();
					}

					ui.switch.init($('.switch.default .ui-switch', row), {
						status: s_default,
						change: function(status){
							if (status) {
								row.siblings('.row').find('.switch.default  .ui-switch').removeClass('active');
							}
						},
						text: lang['fields_types_select_default']
					});

					ui.switch.init($('.switch.dependent .ui-switch', row), {
						status: s_dependent,
						change: function(status){
							$('.block', row).toggle(status);
						},
						text: lang['fields_types_select_s_enable']
					});
				};

				x.fields = $('<div class="container system select"><div class="field">\
					<div class="head"><p>' + lang['fields_types_select_values'] + ' <span title="' + lang['fields_types_select_faq'] + '">( ? )</span></p></div>\
					<div class="group">\
						<div class="add">' + lang['fields_types_select_add'] + '</div>\
						<div class="rows"></div>\
					</div>\
				</div></div>').insertAfter(parent);
				x.rows = $('.rows', x.fields);

				x.fields.on('click', '.add', function(){
					x.append_row();
				}).on('click', '.remove', function(){
					$(this).parent().remove();
				}).on('click', '.block .show p', function(){
					var th = $(this);
					var id = +th.attr('data');
					var parent = th.parents('.block');
					th.toggleClass('active');
					$('.hide p[data="' + id + '"]', parent).removeClass('active').toggle(!th.hasClass('active'));
				}).on('click', '.block .hide p', function(){
					var th = $(this);
					var id = +th.attr('data');
					var parent = th.parents('.block');
					th.toggleClass('active');
					$('.show p[data="' + id + '"]', parent).removeClass('active').toggle(!th.hasClass('active'));
				});

				x.append_row();
			},
			attr_edit: function(elems){
				var x = this;

				var elems = $.parseJSON(elems || '{}');

				if (elems.eng) {
					// старое открытие для совместимости
					// удалить когда все поля select будут пересохранены
					var arr = {};

					$.each(elems, function(l, els){
						$.each(els, function(k, v){
							if (!arr[k]) arr[k] = {lang: {}, dependent: {use: false, show: [], hide: []}, default: false};
							arr[k].lang[l] = v;
						});
					});

					elems = $.extend({}, arr);
				}

				x.rows.empty();
				$.each(elems, function(id, value){
					x.append_row(id, value);
				});
			},
			attr_save: function(){
				var x = this;

				var json = {};

				$('.row', x.rows).each(function(){
					var th = $(this);
					var id = +th.attr('data');

					json[id] = {lang: {}, dependent: {use: false, show: [], hide: []}, default: false};

					$('.labels label', th).each(function(){
						var th = $(this);
						var lang = th.attr('data');
						var val = $('input', th).val().trim();

						json[id].lang[lang] = val;
					});

					json[id].dependent.use = ui.switch.get($('.switch.dependent .ui-switch', th));
					json[id].default = ui.switch.get($('.switch.default .ui-switch', th));

					$('.block .show p.active', th).each(function(){
						var th = $(this);
						var data = +th.attr('data');
						json[id].dependent.show.push(data);
					});
					$('.block .hide p.active', th).each(function(){
						var th = $(this);
						var data = +th.attr('data');
						json[id].dependent.hide.push(data);
					});
				});

				return JSON.stringify(json);
			},
			item_add: function(parent, value, elems, section, lang_active, dependent){
				var section = section || 'items';
				var lang_active = lang_active || window[section].lang_active;
				var elems = $.parseJSON(elems || '{}');

				var fs = $.map(elems, function(el, id){
					var val = el.lang[lang_active] || el.lang[settings.arr.langFrontDefault] || '';
					return '<p class="animate1 br3" data="' + id + '">' + val + '</p>';
				}).join('') + '<div class="clr"></div>';

				parent.append(fs).on('click', 'p', function(){
					var th = $(this);
					var data = +th.attr('data');
					th.addClass('active').siblings().removeClass('active');

					if (dependent && elems[data].dependent.use) dependent(data, elems);
				});

				if (value && elems[value]) {
					$('p[data="' + value + '"]', parent).trigger('click');
				} else {
					$.each(elems, function(id, val){
						if (val.default) {
							$('p[data="' + id + '"]', parent).trigger('click');
							return false;
						}
					});

					if (dependent) dependent(false, elems);
				}
			},
			item_save: function(parent){
				return $('p.active', parent).attr('data') || '';
			},
			bases: {
				view: function(str, id){
					var json = $.parseJSON(fields.arr.fields[id].value || '{}');

					if (json[str]) return json[str].lang[settings.arr.langFrontDefault] || '';
					return '';
				},
				sort: function(str, id){
					var json = $.parseJSON(fields.arr.fields[id].value || '{}');

					if (json[str]) return json[str].lang[settings.arr.langFrontDefault] || '';
					return '';
				}
			}
		},
		file: {
			title: lang['fields_types_file_title'],
			description: lang['fields_types_file_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value, elems, section){
				var section = section || 'items';

				var check_empty = function(){
					var gallery = $('.image', parent);
					if (!gallery.length) {
						edit.nextAll().remove();
						edit.after('<div class="empty br3 box">' + lang['fields_types_file_not_selected'] + '</div><div class="clr"></div>');
					}
				};
				var appendImage = function(ids){
					edit.nextAll().remove();

					var html = [];
					$.each(ids, function(i, el){
						var file = el ? files.arr.files[el] : false;
						if (file) {
							if (file.type === 'image') {
								html.push('<div class="image box f-' + file.type + '" data="' + el + '">\
									<div class="inner"><div class="bg box br3" style="background-image: url(' + siteurl + 'qrs/getfile/' + el + '/200/200/0);"></div></div>\
									<div class="title" title="' + file.title + '">' + file.title + '</div>\
									<div class="remove br3">' + icons.remove + '</div>\
								</div>');
							} else {
								html.push('<div class="image box f-' + file.type + '" data="' + el + '">\
									<div class="inner"><div class="bg box br3">' + icons['format_' + file.type] + '</div></div>\
									<div class="title" title="' + file.title + '">' + file.title + '</div>\
									<div class="remove br3">' + icons.remove + '</div>\
								</div>');
							}
						}
					});
					parent.append('<div class="images">' + html.join('') + '<div class="clr"></div></div>');

					check_empty();
				};

				parent.on('click', '.remove', function(){
					$(this).parent().remove();
					check_empty();
				});

				var edit = $('<div class="edit" />').text(lang['fields_types_file_edit_file']).click(function(){
					files.openFiles = 1;
					files.openFilesSelected = $('.image', parent).map(function(){
						return +$(this).attr('data');
					}).get();
					files.start();

					$('.f.selected', files.el.list).removeClass('selected');
					$.each(files.openFilesSelected, function(i, el){
						$('.f#' + el, files.el.list).addClass('selected');
					});

					var close = function(){
						actions.remove();

						window[section].reset();
						files.openFiles = false;
						$('.f.selected', files.el.list).removeClass('selected');
					};
					var actions = $('<div class="actions" />');
					var btn_back = $('<div class="back br3">' + lang['fields_types_file_back'] + '</div>').on('click', function(){
						close();
					});
					var btn_save = $('<div class="save br3">' + lang['fields_types_file_save'] + '</div>').on('click', function(){
						if (!files.openFilesSelected.length) {
							alertify.error(lang['fields_types_file_error_not_selected']);
							return false;
						}
						appendImage(files.openFilesSelected);
						close();
					});
					actions.append(btn_save, btn_back);
					common.el.header.append(actions);
				}).appendTo(parent);

				files.loadList(function(){
					appendImage([+value || 0]);
				});
			},
			item_save: function(parent){
				return +$('.image', parent).attr('data') || '';
			},
			bases: {
				view: function(str){
					return '<div class="image br3" style="background-image: url(/qrs/getfile/' + (str || 0) + '/200/200/0);"></div>';
				},
				sort: function(str){
					return str;
				}
			}
		},
		multiple_files: {
			title: lang['fields_types_multiple_files_title'],
			description: lang['fields_types_multiple_files_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value, elems, section){
				var section = section || 'items';

				var check_empty = function(){
					var gallery = $('.image', parent);
					if (!gallery.length) {
						$('.images', parent).sortable('destroy');
						edit.nextAll().remove();
						edit.after('<div class="empty br3 box">' + lang['fields_types_multiple_files_not_selected'] + '</div><div class="clr"></div>');
					}
				};
				var appendImage = function(ids){
					edit.nextAll().remove();

					var html = [];
					$.each(ids, function(i, el){
						var file = el ? files.arr.files[el] : false;
						if (file) {
							if (file.type === 'image') {
								html.push('<div class="image box f-' + file.type + '" data="' + el + '">\
									<div class="inner"><div class="bg box br3" style="background-image: url(' + siteurl + 'qrs/getfile/' + el + '/200/200/0);"></div></div>\
									<div class="title" title="' + file.title + '">' + file.title + '</div>\
									<div class="remove br3">' + icons.remove + '</div>\
								</div>');
							} else {
								html.push('<div class="image box f-' + file.type + '" data="' + el + '">\
									<div class="inner"><div class="bg box br3">' + icons['format_' + file.type] + '</div></div>\
									<div class="title" title="' + file.title + '">' + file.title + '</div>\
									<div class="remove br3">' + icons.remove + '</div>\
								</div>');
							}
						}
					});
					parent.append('<div class="images">' + html.join('') + '<div class="clr"></div></div>');
					$('.images', parent).sortable({items: '.image', tolerance: 'pointer', activate: function(e, ui){
						ui.sender.sortable('refreshPositions');
					}});

					check_empty();
				};

				parent.on('click', '.remove', function(){
					$(this).parent().remove();
					check_empty();
				});

				var edit = $('<div class="edit" />').text(lang['fields_types_file_edit_files']).click(function(){
					files.openFiles = 2;
					files.openFilesSelected = $('.image', parent).map(function(){
						return +$(this).attr('data');
					}).get();
					files.start();

					$('.f.selected', files.el.list).removeClass('selected');
					$.each(files.openFilesSelected, function(i, el){
						$('.f#' + el, files.el.list).addClass('selected');
					});

					var close = function(){
						actions.remove();

						window[section].reset();
						files.openFiles = false;
						$('.f.selected', files.el.list).removeClass('selected');
					};
					var actions = $('<div class="actions" />');
					var btn_back = $('<div class="back br3">' + lang['fields_types_multiple_files_back'] + '</div>').on('click', function(){
						close();
					});
					var btn_save = $('<div class="save br3">' + lang['fields_types_multiple_files_save'] + '</div>').on('click', function(){
						if (!files.openFilesSelected.length) {
							alertify.error(lang['fields_types_multiple_files_error_not_selected']);
							return false;
						}
						appendImage(files.openFilesSelected);
						close();
					});
					actions.append(btn_save, btn_back);
					common.el.header.append(actions);
				}).appendTo(parent);

				files.loadList(function(){
					appendImage(value ? $.map(String(value).split(','), function(el, i){
						if (el) return +el;
					}) : []);
				});
			},
			item_save: function(parent){
				return $('.image', parent).map(function(){
					return +$(this).attr('data');
				}).get().join(',');
			},
			bases: {
				view: function(str){
					var ids = str ? str.split(',') : [];
					if (ids.length) {
						return '<div class="image br3" style="background-image: url(/qrs/getfile/' + ids[0] + '/200/200/0);"></div>' + (ids.length > 1 ? '<div class="other">...</div>' : '');
					}

					return '';
				},
				sort: function(str){
					return str;
				}
			}
		},
		video: {
			title: lang['fields_types_video_title'],
			description: lang['fields_types_video_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value, elems, section){
				var section = section || 'items';

				var add = function(el){
					var video = $('<div class="f" />').appendTo(parent);
					var input = $('<input type="text" class="br3 box animate1" value="" placeholder="' + lang['fields_types_video_placeholder'] + '">').appendTo(video);
					var view = $('<div class="view animate1" />').appendTo(video);

					var link = '';
					if (el[0] == 'youtube') link = 'http://youtu.be/' + el[1];
					if (el[0] == 'vimeo') link = 'http://vimeo.com/' + el[1];
					input.val(link).trigger('keyup');
				};

				$('<p />').text(lang['fields_types_video_add']).appendTo(parent).click(function(){
					add(['', '']);
				});

				parent.on('click', '.view', function(){
					$(this).toggleClass('active').next().toggleClass('show');
					//window[section].reinit_scrollbars(0);
				}).on('keyup', 'input', function(){
					var th = $(this);
					var val = th.val().trim();
					var video = th.parent();

					var media = {service: false, id: false};
					var regs = {
						youtube: {
							reg: /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#\&\?]*).*/,
							link: '//www.youtube.com/embed/$link?rel=0'
						},
						vimeo: {
							reg: /^.*(vimeo.com\/)(\d+)/,
							link: '//player.vimeo.com/video/$link'
						}
					};
					// http://www.youtube.com/watch?v=6o-nmK9WRGE&feature=player_embedded
					// http://www.youtube.com/watch?v=0zM3nApSvMg&feature=feedrec_grec_index
					// http://www.youtube.com/user/IngridMichaelsonVEVO#p/a/u/1/QdK8U-VIH_o
					// http://www.youtube.com/v/0zM3nApSvMg?fs=1&hl=en_US&rel=0
					// http://www.youtube.com/watch?v=0zM3nApSvMg#t=0m10s
					// http://www.youtube.com/embed/0zM3nApSvMg?rel=0
					// http://www.youtube.com/watch?v=0zM3nApSvMg
					// http://youtu.be/0zM3nApSvMg
					// http://vimeo.com/100576137

					$('iframe', video).remove();

					for (var service in regs) {
						var match = val.match(regs[service].reg);
						if (match && match[2]) {
							media = {service: service, id: match[2]};
							break;
						}
					}

					if (media.service && media.id) {
						video.attr('video', media.service + ';' + media.id);
						th.removeClass('incorrect').addClass('correct');
						var link = regs[media.service].link.replace('$link', media.id);
						video.append('<iframe width="100%" height="300" src="' + link + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>');
						$('.view', video).removeClass('active').show();
					} else {
						video.attr('video', '');
						th.removeClass('correct').addClass('incorrect');
						$('.view', video).hide();
					}
					if (!val) th.removeClass('incorrect');
				});

				if (value) {
					value = value.split('~;~');
					$.each(value, function(i, el){
						if (el) add(el.split(';'));
					});
				} else {
					add(['', '']);
				}
			},
			item_save: function(parent){
				return $('.f', parent).map(function(){
					return $(this).attr('video');
				}).get().join('~;~');
			},
			bases: {
				view: function(str){
					var str = str ? str.split('~;~') : [];
					return $.map(str, function(s){
						var el = s.split(';');
						var link = false;
						if (el[0] == 'youtube') link = 'http://youtu.be/' + el[1];
						if (el[0] == 'vimeo') link = 'http://vimeo.com/' + el[1];
						if (link) return '<a href="' + link + '" target="_blank">' + link + '</a>';
					}).join(', ').short(200, ',');
				},
				sort: function(str){
					return str;
				}
			}
		},
		date: {
			title: lang['fields_types_date_title'],
			description: lang['fields_types_date_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				var input = $('<input type="text" class="br3 box animate1 date" value="">').appendTo(parent);
				input.datepicker({dateFormat: 'dd.mm.yy'});
				var zone = new Date(value * 1000).getTimezoneOffset();
				if (value) input.datepicker('setDate', new Date(value * 1000 + zone * 60 * 1000));
			},
			item_save: function(parent){
				var val = $('.date', parent).val().trim();
				if (!val) return val;
				var date = $('.date', parent).datepicker('getDate');
				var zone = new Date(date).getTimezoneOffset();
				return (new Date(date).getTime() - zone * 60 * 1000) / 1000;
			},
			bases: {
				view: function(str){
					if (str) {
						var date = new Date(str * 1000);
						var day = date.getDate(); day = (day < 10 ? '0' : '') + day;
						var month = date.getMonth() + 1; month = (month < 10 ? '0' : '') + month;
						var year = date.getFullYear();

						return day + '.' + month + '.' + year;
					}

					return '';
				},
				sort: function(str){
					return str;
				}
			}
		},
		calendar: {
			title: lang['fields_types_calendar_title'],
			description: lang['fields_types_calendar_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				var add = $('<div class="add_row">' + lang['fields_types_calendar_add'] + '</div>').appendTo(parent).click(function(){
					append([new Date().getTime() / 1000, 0, 24 * 60 * 60]);
				});

				var append = function(val){
					var date = $('<div class="date"><input type="text" class="br3 box animate1" value=""><div class="remove">' + icons.remove + '</div><div class="range"><div class="range-wrap br3"></div></div><div class="clr"></div></div>').appendTo(parent);
					$('input', date).data('time', [val[1], val[2]]).datepicker({dateFormat: 'dd.mm.yy'}).datepicker('setDate', new Date(+val[0] * 1000 + (new Date(+val[0] * 1000).getTimezoneOffset() * 60 * 1000)));
					$('.remove', date).click(function(){
						date.remove();
					});
					$('.range-wrap', date).slider({
						range: true, min: 0, max: 24 * 60,
						step: 10,
						slide: function(e, ui){
							var hour = Math.floor(ui.value / 60);
							var minute = ui.value - hour * 60;
							$(ui.handle).html('<span>' + hour + ':' + (minute < 10 ? '0' : '') + minute + '</span>');
						},
						change: function(e, ui){
							var hour = Math.floor(ui.value / 60);
							var minute = ui.value - hour * 60;
							$(ui.handle).html('<span>' + hour + ':' + (minute < 10 ? '0' : '') + minute + '</span>');
							$('input', date).data('time', [ui.values[0] * 60, ui.values[1] * 60]);
						}
					}).slider('values', [val[1] / 60, val[2] / 60]).find('.ui-slider-handle').addClass('br3');
				};

				if (value) {
					var val = value.split('~;~');
					$.each(val, function(i, el){
						append(el.split(','));
					});
				} else {
					append([new Date().getTime() / 1000, 0, 24 * 60 * 60]);
				}
			},
			item_save: function(parent){
				var value = [];
				$('.date', parent).each(function(){
					var input = $('input', this);
					var val = input.val().trim();
					if (val) {
						val = (new Date(input.datepicker('getDate')).getTime() - (new Date(input.datepicker('getDate')).getTimezoneOffset() * 60 * 1000)) / 1000;
						var time = input.data('time');
						value.push(val + ',' + time[0] + ',' + time[1]);
					}
				});

				return value.join('~;~');
			},
			bases: {
				view: function(str){
					var str = str ? str.split('~;~') : [];
					return $.map(str, function(s){
						var el = s.split(',');
						var timezone = new Date().getTimezoneOffset();

						var date1 = new Date(+el[0] * 1000);
						var day = date1.getDate(); day = (day < 10 ? '0' : '') + day;
						var month = date1.getMonth() + 1; month = (month < 10 ? '0' : '') + month;
						var year = date1.getFullYear();

						var date2 = new Date(+el[1] * 1000 + timezone*60*1000);
						var hours1 = date2.getHours(); hours1 = (hours1 < 10 ? '0' : '') + hours1;
						var minutes1 = date2.getMinutes(); minutes1 = (minutes1 < 10 ? '0' : '') + minutes1;
						var date3 = new Date(+el[2] * 1000 + timezone*60*1000);
						var hours2 = date3.getHours(); hours2 = (hours2 < 10 ? '0' : '') + hours2;
						var minutes2 = date3.getMinutes(); minutes2 = (minutes2 < 10 ? '0' : '') + minutes2;

						return day + '.' + month + '.' + year + ' ' + hours1 + ':' + minutes1 + ' - ' + hours2 + ':' + minutes2;
					}).join(', ').short(100, ',');
				},
				sort: function(str){
					return str;
				}
			}
		},
		color: {
			title: lang['fields_types_color_title'],
			description: lang['fields_types_color_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value, elems, section){
				//var section = section || 'items';

				var input = $('<input class="br3 box animate1" type="text">').appendTo(parent);
				var outer = $('<div class="outer br3" />').append('<i />').appendTo(parent);
				// http://mjolnic.com/bootstrap-colorpicker/
				input.colorpicker({
					container: parent,
					customClass: 'br3',
					align: 'left',
					sliders: {
						saturation: {maxLeft: 150, maxTop: 150},
						hue: {maxTop: 150},
						alpha: {maxTop: 150}
					}
				}).on('changeColor.colorpicker', function(e){
					var color = e.color.toString(e.color.origFormat);
					$('i', outer).css({background: color});
					input.val(color);
				}).on('showPicker.colorpicker', function(e){
					//window[section].reinit_scrollbars(0);
				}).on('hidePicker.colorpicker', function(e){
					//window[section].reinit_scrollbars(0);
				});
				outer.on('click', function(){
					input.colorpicker('show');
				});

				if (!value) value = '#000000';
				input.colorpicker('setValue', value).val(value);
			},
			item_save: function(parent){
				return $('input', parent).val().trim();
			},
			bases: {
				view: function(str){
					if (str) return '<div class="text"><div class="color" style="background:' + str + '"></div>' + str + '</div>';
					return '';
				},
				sort: function(str){
					return str;
				}
			}
		},
		users: {
			title: lang['fields_types_users_title'],
			description: lang['fields_types_users_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				parent.append($.map(users.arr.users, function(el, i){
					if (el && el.id !== 1) {
						var active = el.id === value ? ' active' : '';
						return '<p class="br3 animate1' + active + '" data="' + i + '">' + el.fname + '</p>';
					}
				}).join('') + '<div class="clr"></div>');

				parent.on('click', 'p', function(){
					$(this).toggleClass('active').siblings().removeClass('active');
				});
			},
			item_save: function(parent){
				return +$('p.active', parent).attr('data') || 0;
			},
			bases: {
				view: function(str){
					return users.arr.users[str] ? users.arr.users[str].fname : '';
				},
				sort: function(str){
					return users.arr.users[str] ? users.arr.users[str].fname : '';
				}
			}
		},
		flag: {
			title: lang['fields_types_flag_title'],
			description: lang['fields_types_flag_desc'],
			attr_add: function(parent){
				var x = this;

				x.parent = $('<div class="container system s_flag">').insertAfter(parent);

				x.parent.append('\
					<div class="field select">\
						<div class="head"><p>' + lang['fields_types_flag_s_default'] + '</p></div>\
						<div class="group">\
							<p class="br3 animate1" data="1">' + lang['fields_types_flag_yes'] + '</p>\
							<p class="br3 animate1 active" data="0">' + lang['fields_types_flag_no'] + '</p>\
							<div class="clr"></div>\
						</div>\
					</div>\
					<div class="switch enable">' + ui.switch.html() + '</div>\
					<div class="block">\
						<div class="switch reverse">' + ui.switch.html() + '</div>\
						<div class="fs">' + $.map(fields.arr.fields['#'].childs, function(id){
							var f = fields.arr.fields[id];
							if (!f) return '';
							if (fields.mode === id) return '';
							return '<p class="animate1" data="' + id + '">' + f.public_title + '</p>';
						}).join('') + '</div>\
					</div>\
				');
				var sw_enable = $('.switch.enable .ui-switch', x.parent);
				var sw_reverse = $('.switch.reverse .ui-switch', x.parent);

				ui.switch.init(sw_enable, {
					status: false,
					change: function(status){
						$('.block', x.parent).toggle(status);
					},
					text: lang['fields_types_flag_s_enable']
				});
				ui.switch.init(sw_reverse, {
					status: true,
					change: function(status){},
					text: lang['fields_types_flag_s_reverse']
				});
				x.parent.on('click', '.fs p', function(){
					$(this).toggleClass('active');
				}).on('click', '.group p', function(){
					$(this).addClass('active').siblings().removeClass('active');
				});
			},
			attr_edit: function(value){
				var x = this;

				if (!value) return false;

				var json = $.parseJSON(value);

				$('.select .group p[data="' + json.default + '"]', x.parent).trigger('click');
				$('.switch.enable .ui-switch', x.parent).toggleClass('active', json.dependent.use);
				$('.block', x.parent).toggle(json.dependent.use);
				$('.switch.reverse .ui-switch', x.parent).toggleClass('active', !json.dependent.reverse);
				$.map(json.dependent.fields, function(id){
					$('.fs p[data="' + id + '"]', x.parent).addClass('active');
				});
			},
			attr_save: function(){
				var x = this;

				var json = {
					default: +$('.select .group p.active', x.parent).attr('data'),
					dependent: {
						use: ui.switch.get($('.switch.enable .ui-switch', x.parent)),
						reverse: !ui.switch.get($('.switch.reverse .ui-switch', x.parent)),
						fields: $('.fs p.active', x.parent).map(function(){
							return +$(this).attr('data');
						}).get()
					}
				};

				return JSON.stringify(json);
			},
			item_add: function(parent, value, elems, notuse1, notuse2, dependent){
				var json = $.parseJSON(elems || '{}');
				var val = parseInt(value) ? 1 : json.default;

				parent.html('\
					<p class="br3 animate1' + (val === 1 ? ' active' : '') + '" data="1">' + lang['fields_types_flag_yes'] + '</p>\
					<p class="br3 animate1' + (val === 0 ? ' active' : '') + '" data="0">' + lang['fields_types_flag_no'] + '</p>\
					<div class="clr"></div>\
				').on('click', 'p', function(){
					var th = $(this);
					var data = +th.attr('data');
					th.addClass('active').siblings().removeClass('active');

					if (dependent && json.dependent.use) dependent(data, json);
				});

				if (dependent && json.dependent.use) dependent(val, json);
			},
			item_save: function(parent){
				return +$('p.active', parent).attr('data') || '';
			},
			bases: {
				view: function(str){
					if (str == 1) return lang['fields_types_flag_yes'];
					return lang['fields_types_flag_no'];
				},
				sort: function(str){
					return str || 0;
				}
			}
		},
		items: {
			title: lang['fields_types_items_title'],
			description: lang['fields_types_items_desc'],
			attr_add: function(parent){
				var x = this;

				x.parent = $('<div class="container system s_items">').insertAfter(parent);

				x.parent.append('<div class="field text"><div class="head"><p>' + lang['fields_types_items_s_title'] + '</p></div><div class="group"><div class="add">' + lang['fields_types_items_s_add'] + '</div></div></div>');

				x.parent.on('click', '.close', function(){
					$(this).parent().remove();
				}).on('click', '.add', function(){
					x.append('', true);
				});

				x.append = function(id, childs){
					var row = $('<div class="row">\
						<input type="text" class="br3 box animate1" value="' + id + '" placeholder="' + lang['fields_types_items_s_id_ph'] + '">\
						<div class="close">\
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg>\
						</div>\
						<div class="switch">' + ui.switch.html() + '</div>\
					</div>');
					$('.group', x.parent).append(row);

					var sw = $('.switch .ui-switch', row);

					ui.switch.init(sw, {
						status: childs,
						change: function(status){},
						text: lang['fields_types_items_s_use_childs']
					});
				};

				x.append('#', true);
			},
			attr_edit: function(elems){
				var x = this;

				if (!elems) return false;

				var json = $.parseJSON(elems);

				$('.row', x.parent).remove();

				$.each(json.parents, function(i, el){
					x.append(el[0], el[1]);
				});
			},
			attr_save: function(){
				var x = this;

				var json = {parents: []};
				var valid = false;

				$('.row', x.parent).each(function(){
					var th = $(this);
					var id = $('input', th).val().trim();
					var childs = ui.switch.get($('.switch .ui-switch', th));

					if (id) {
						json.parents.push([+id || id, childs]);
						valid = true;
					}
				});

				if (!valid) json.parents.push(['#', true]);

				return JSON.stringify(json);
			},
			item_add: function(parent, value, elems){
				parent.html('<div class="left box"><div class="ui-combobox"></div></div><div class="right box"><div class="elems"></div></div><div class="clr"></div><div class="loading br3"></div>');

				var $combobox = $('.ui-combobox', parent);
				var $elems = $('.elems', parent);
				var loading = $('.loading', parent);
				var fields = [];
				var titles = {};
				var value = value ? $.map(value.split(';'), function(el){return +el}) : [];
				var combobox = null;

				var start = function(){
					loading.remove();

					combobox = new ui.combobox($combobox, {
						placeholder: lang['fields_types_items_find_ph'],
						empty: lang['fields_types_items_find_empty'],
						fields: fields,
						selectedItems: value,
						onSelect: function(id){
							var item = add_field(id);

							if (item) {
								item.addClass('added');
								setTimeout(function(){
									item.removeClass('added');
								}, 1000);
							}
						}
					});

					$.each(value, function(i, id){
						add_field(id);
					});

					check_empty();
				};

				var add_field = function(id){
					if (!id || !titles[id]) {
						check_empty();
						return false;
					}

					var item = $('<div class="item br3 box" data="' + id + '" title="ID ' + id + '">\
						<div class="remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg></div>\
						<div class="title">' + titles[id] + '</div>\
					</div>');

					$elems.append(item);

					check_empty();

					$elems.sortable({items: '.item', tolerance: 'pointer', axis: 'y', activate: function(e, ui){
						ui.sender.sortable('refreshPositions');
					}});

					return item;
				};
				var check_empty = function(){
					var items = $('.item', $elems);

					if (items.length) {
						$elems.find('.empty').remove();
					} else {
						$elems.html('<div class="empty br3 box">' + lang['fields_types_items_empty'] + '</div>');
					}
				};

				parent.on('click', '.remove', function(){
					var th = $(this).parent();
					var id = +th.attr('data');
					th.remove();
					check_empty();

					var k = $.inArray(id, combobox.options.selectedItems);
					if (k + 1) {
						combobox.options.selectedItems.splice(k, 1);
						combobox.reset();
					}
				});

				$.post('?fields/t_items_get_items', {json: elems}, function(json){
					fields = json.items;
					$.each(fields, function(i, el){
						titles[el[0]] = el[1];
					});

					start();
				}, 'json');
			},
			item_save: function(parent){
				var ids = $('.elems .item', parent).map(function(){
					return $(this).attr('data');
				}).get();

				return ids.join(';');
			},
			bases: {
				view: function(str){
					var ids = str ? str.split(';') : [];

					return $.map(ids, function(id){
						if (id && items.arr[id]) return items.arr[id].private_title;
					}).join(', ');
				},
				sort: function(str){
					var ids = str ? str.split(';') : [];

					return $.map(ids, function(id){
						if (id && items.arr[id]) return items.arr[id].private_title;
					}).join(', ');
				}
			}
		},
		base: {
			title: lang['fields_types_base_title'],
			description: lang['fields_types_base_desc'],
			attr_add: function(parent){},
			attr_edit: function(elems){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				parent.html('<div class="edit">' + lang['fields_types_base_edit'] + '</div><div class="loading br3 box"></div>');

				var value = value ? $.map(value.split(';'), function(el){return +el}) : [];
				var loading = $('.loading', parent);
				var base = {fields: []};
				var items = {};

				var start = function(){
					$('.item', parent).remove();

					var html = $.map(value, function(id){
						if (!id || !items[id]) return true;

						var item = items[id];
						var width = 100 / base.fields.length;

						var f = $.map(base.fields, function(v){
							var cl = '';
							var co = '';

							if (typeof v === 'number') {
								var type = fields.arr.fields[v].type;
								cl = 'f f_' + v + ' f_' + type;
								co = fields.types[type].bases.view(item.fields[v] || '', v);
							} else if (v === 'image') {
								cl = 'f f_file';
								co = fields.types.file.bases.view(item.image);
							} else {
								cl = v;
								co = item[v];
							}
							return '<div class="box ' + cl + '" style="width:' + width + '%;">' + co + '</div>';
						}).join('');

						return '<div class="item" data="' + id + '">\
							<div class="remove"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg></div>\
							<div class="inner br3 box" title="ID ' + id + '">' + f + '</div>\
						</div>';
					}).join('');
					parent.append(html);

					check_empty();
				};
				var check_empty = function(){
					var items = $('.item', parent);

					if (items.length) {
						parent.find('.empty').remove();
					} else {
						parent.append('<div class="empty br3 box">' + lang['fields_types_base_empty'] + '</div>');
					}
				};

				parent.on('click', '.edit', function(){
					var new_value = value.slice();

					var bases = $('<div id="base_select_items">\
						<div class="overlay loader animate2"></div>\
						<div class="popup br3 animate2"></div>\
					</div>').appendTo('body');

					var count = 0;
					var filter_val = '';
					var filter = function(){
						$('.filter .clear', bases).toggleClass('show', !!filter_val);

						if (filter_val) {
							$('.empty', bases).remove();

							$('.item', bases).addClass('hide').each(function(){
								var th = $(this);
								var vars = th.text().toLowerCase();
								var valid = true;

								$.each(filter_val.toLowerCase().split(' '), function(i, text){
									if (vars.indexOf(text) === -1) valid = false;
								});

								if (valid) th.removeClass('hide');
							});

							var hide = $('.item.hide', bases);

							if (count === 0 || hide.length === count) $('.items', bases).append('<div class="empty">' + lang['fields_types_base_popup_empty'] + '</div>');
							$('.count', bases).text((count - hide.length) + ' / ' + count);
						} else {
							$('.empty', bases).remove();
							$('.count', bases).text('');
							$('.item', bases).removeClass('hide');
						}
					};
					var select = function(){
						var count = $('.item.selected', bases).length;
						$('.header .title', bases).text(vsprintf(lang['fields_types_base_popup_title'], [count]));
					};

					bases.on('keyup', '.filter input', function(){
						filter_val = $(this).val().trim();
						filter();
					}).on('click', '.filter .clear', function(){
						$(this).prev().prev().val('').focus();

						filter_val = '';
						filter();
					}).on('click', '.save', function(){
						value = new_value.slice().reverse();

						start();

						$('.cancel', bases).trigger('click');
					}).on('click', '.cancel', function(){
						$('.overlay', bases).removeClass('show');
						$('.popup', bases).removeClass('show');

						setTimeout(function(){
							bases.remove();
						}, 210);
					}).on('click', '.item', function(){
						var th = $(this);
						var id = +th.attr('data');

						th.toggleClass('selected');

						if (th.hasClass('selected')) {
							new_value.unshift(id);
						} else {
							var k = $.inArray(id, new_value);
							if (k + 1) new_value.splice(k, 1);
						}

						select();
					});

					$('.overlay', bases).addClass('show');

					setTimeout(function(){
						$.get('?database/get_itemsByBase', function(json){
							$.each(json.items, function(i, item){
								items[item.id] = item;
							});
							$.extend(base, json.base);
							count = json.items.length;

							var width = 100 / base.fields.length;

							var html = $.map(json.items, function(item){
								var selected = $.inArray(item.id, value) + 1 ? ' selected' : '';

								var f = $.map(base.fields, function(v){
									var cl = '';
									var co = '';

									if (typeof v === 'number') {
										var type = fields.arr.fields[v].type;
										cl = 'f f_' + type;
										co = fields.types[type].bases.view(item.fields[v] || '', v);
									} else if (v === 'image') {
										cl = 'f f_file';
										co = fields.types.file.bases.view(item.image);
									} else {
										cl = v;
										co = item[v];
									}
									return '<div class="box ' + cl + '" style="width:' + width + '%;">' + co + '</div>';
								}).join('');

								return '<div class="item' + selected + '" data="' + item.id + '">' + f + '</div>';
							}).reverse().join('');

							if (!html) html = '<div class="empty">' + lang['fields_types_base_popup_empty'] + '</div>';

							$('.popup', bases).html('\
								<div class="header">\
									<div class="actions">\
										<div class="filter">\
											<input class="br3 box animate1" type="text" placeholder="' + lang['fields_types_base_popup_filter_ph'] + '">\
											<div class="count"></div>\
											<div class="clear">\
												<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 212.982 212.982"><path d="M131.804 106.49l75.936-75.935c6.99-6.99 6.99-18.323 0-25.312-6.99-6.99-18.322-6.99-25.312 0L106.49 81.18 30.555 5.242c-6.99-6.99-18.322-6.99-25.312 0-6.99 6.99-6.99 18.323 0 25.312L81.18 106.49 5.24 182.427c-6.99 6.99-6.99 18.323 0 25.312 6.99 6.99 18.322 6.99 25.312 0L106.49 131.8l75.938 75.937c6.99 6.99 18.322 6.99 25.312 0 6.99-6.99 6.99-18.323 0-25.313l-75.936-75.936z"></path></svg>\
											</div>\
										</div>\
										<div class="br3 save">' + lang['fields_types_base_popup_save'] + '</div>\
										<div class="br3 cancel">' + lang['fields_types_base_popup_cancel'] + '</div>\
									</div>\
									<div class="title">' + vsprintf(lang['fields_types_base_popup_title'], [value.length]) + '</div>\
								</div>\
								<div class="wrapper box"><div class="items br3">' + html + '</div></div>\
							');
							$('.popup', bases).addClass('show');

							setTimeout(function(){
								$('.popup .filter input', bases).focus();
							}, 100);
						}, 'json');
					}, 210);
				}).on('click', '.remove', function(){
					var th = $(this).parent();
					var id = +th.attr('data');

					th.remove();
					check_empty();

					var k = $.inArray(id, value);
					if (k + 1) value.splice(k, 1);
				}).sortable({items: '.item', tolerance: 'pointer', axis: 'y'});

				if (value.length) {
					$.post('?database/get_itemsById', {ids: value}, function(json){
						$.each(json.items, function(i, item){
							items[item.id] = item;
						});
						$.extend(base, json.base);

						loading.remove();
						start();
					}, 'json');
				} else {
					loading.remove();
					start();
				}
			},
			item_save: function(parent){
				var ids = $('.item', parent).map(function(){
					return $(this).attr('data');
				}).get().join(';');

				return ids;
			},
			bases: {
				view: function(str){
					return str;
				},
				sort: function(str){
					return str;
				}
			}
		},
		currency: {
			title: lang['fields_types_currency_title'],
			description: lang['fields_types_currency_desc'],
			attr_add: function(){},
			attr_edit: function(){},
			attr_save: function(){
				return '';
			},
			item_add: function(parent, value){
				var val = value ? String(value) : '';
				var input = $('<input type="text" class="br3 box animate1" value="">').val(val).appendTo(parent);
				var mask = IMask(input.get(0), {
					mask: Number,
					scale: 2,
					signed: false,
					thousandsSeparator: ',',
					padFractionalZeros: false,
					normalizeZeros: true,
					radix: '.',
					mapToRadix: ['.']
				});
				input.data('mask', mask);
			},
			item_save: function(parent){
				return $('input', parent).data('mask').unmaskedValue;
			},
			bases: {
				view: function(str){
					var mask = IMask.createMask({
						mask: Number,
						scale: 2,
						signed: false,
						thousandsSeparator: ',',
						padFractionalZeros: false,
						normalizeZeros: true,
						radix: '.',
						mapToRadix: ['.']
					});
					mask.resolve(str);
					return mask.value;
				},
				sort: function(str){
					return str;
				}
			}
		}
	}
};

$.fn.field = function(options){
	var el = this;
	var options = $.extend(true, {
		id: 0,
		value: '',
		lang: 'eng',
		on: {
			change: false
		},
		dependence: false
	}, options);

	if (!el.length) {
		console.error('$.fn.field', options);
		return el;
	}
	if (!fields.arr.fields[options.id]) return el;
	var field = fields.arr.fields[options.id];

	el.addClass(field.type).attr('data', options.id).append('<div class="head"><p>' + field.private_title + '</p></div><div class="group"></div>');

	var group = $('.group', el);
	var data = {
		getValue: function(){
			console.error('Get value error: no handler for this field!', options);
			return '';
		}
	};

	if (field.type === 'text') {
		var old_val = options.value ? String(options.value) : '';
		var input = $('<input type="text" class="br3 box animate1" value="">');
		input.val(old_val).appendTo(group);
		data.getValue = function(){
			return input.val().trim();
		};
		input.on('keydown', function(e){
			if (e.keyCode === 13) input.blur();
		});
		if (typeof options.on.change === 'function') {
			input.on('blur', function(){
				var new_val = data.getValue();

				if (new_val !== old_val) {
					old_val = new_val;
					options.on.change();
				}
			});
		}
	}
	if (field.type === 'select') {
		var old_val = +options.value;
		var elems = $.parseJSON(field.value || '{}');

		var fs = $.map(elems, function(el, id){
			var val = el.lang[options.lang] || el.lang[settings.arr.langFrontDefault] || '';
			return '<p class="animate1 br3" data="' + id + '">' + val + '</p>';
		}).join('') + '<div class="clr"></div>';

		data.getValue = function(){
			return +$('p.active', group).attr('data') || 0;
		};
		group.append(fs).on('click', 'p', function(){
			var th = $(this);

			if (th.hasClass('active')) return false;

			var data = +th.attr('data');
			th.addClass('active').siblings().removeClass('active');

			if (typeof options.on.change === 'function') {
				if (data !== old_val) {
					old_val = data;
					options.on.change();
				}
			}

			if (options.dependence && elems[data].dependent.use) options.dependence(data, elems);
		});

		if (old_val && elems[old_val]) {
			$('p[data="' + old_val + '"]', group).trigger('click');
		} else {
			var s = true;
			$.each(elems, function(id, val){
				if (val.default) {
					s = false;
					$('p[data="' + id + '"]', group).trigger('click');
					return false;
				}
			});

			if (s && options.dependence) options.dependence(false, elems);
		}
	}
	if (field.type === 'users') {
		var old_val = options.value;

		data.getValue = function(){
			return +$('p.active', group).attr('data') || 0;
		};
		group.append($.map(users.arr.users, function(el, i){
			if (el && el.id !== 1) {
				return '<p class="br3 animate1" data="' + i + '">' + el.fname + '</p>';
			}
		}).join('') + '<div class="clr"></div>');

		group.on('click', 'p', function(){
			var th = $(this);
			var id = +th.attr('data');
			th.toggleClass('active').siblings().removeClass('active');
			if (typeof options.on.change === 'function') {
				if (id !== old_val) {
					old_val = id;
					options.on.change();
				}
			}
		});

		$('p[data="' + old_val + '"]', group).trigger('click');
	}
	if (field.type === 'flag') {
		var json = $.parseJSON(field.value || '{}');
		var old_val = +!!+options.value || json.default;

		data.getValue = function(){
			return +$('p.active', group).attr('data') || 0;
		};
		group.html('\
			<p class="br3 animate1" data="1">' + lang['fields_types_flag_yes'] + '</p>\
			<p class="br3 animate1" data="0">' + lang['fields_types_flag_no'] + '</p>\
			<div class="clr"></div>\
		').on('click', 'p', function(){
			var th = $(this);
			if (th.hasClass('active')) return false;
			var data = +th.attr('data');
			th.addClass('active').siblings().removeClass('active');

			if (typeof options.on.change === 'function') {
				if (data !== old_val) {
					old_val = data;
					options.on.change();
				}
			}

			if (options.dependence && json.dependent.use) options.dependence(data, json);
		});

		$('p[data="' + old_val + '"]', group).trigger('click');
	}
	if (field.type === 'currency') {
		var old_val = options.value ? String(options.value) : '';
		var input = $('<input type="text" class="br3 box animate1" value="">');
		input.val(old_val).appendTo(group);
		var mask = IMask(input.get(0), {
			mask: Number,
			scale: 2,
			signed: false,
			thousandsSeparator: ',',
			padFractionalZeros: false,
			normalizeZeros: true,
			radix: '.',
			mapToRadix: ['.']
		});
		data.getValue = function(){
			return mask.unmaskedValue;
		};
		if (typeof options.on.change === 'function') {
			input.on('blur', function(){
				var new_val = data.getValue();

				if (new_val !== old_val) {
					old_val = new_val;
					options.on.change();
				}
			});
		}
	}

	el.data('field', data);

	return el;
};

common.queue.push(fields);