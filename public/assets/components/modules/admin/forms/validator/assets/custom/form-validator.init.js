$.validator.setDefaults(
{
	//submitHandler: function() { alert("submitted!"); },
	showErrors: function(map, list) 
	{
		this.currentElements.parents('label:first, div:first').find('.has-error').remove();
		this.currentElements.parents('.form-group:first').removeClass('has-error');
		
		$.each(list, function(index, error) 
		{
			var ee = $(error.element);
			var eep = ee.parents('label:first').length ? ee.parents('label:first') : ee.parents('div:first');
			
			ee.parents('.form-group:first').addClass('has-error');
			eep.find('.has-error').remove();
			eep.append('<p class="has-error help-block">' + error.message + '</p>');
		});
		//refreshScrollers();
	}
});

$(function()
{
	// validate signup form on keyup and submit
	$("#createBiz").validate({
		rules: {
			label: "required",
			name: {
				required: true,
				minlength: 3
			},
			job_title: {
				required: true,
				minlength: 3
			},
			aff: {
				required: true,
				minlength: 5
			},
			phone: {
				minlength: 6
			},
			email: {
				required: false,
				email: true
			}
		},
		messages: {
			label: "Label is needed so you can find this card easier",
			name: {
				required: "Please enter your name",
				minlength: "Your name must consist of at least 3 characters"
			},
			job_title: {
				required: "Please provide your job title",
				minlength: "Your job title must be at least 3 characters long"
			},
			aff: {
				required: "Please provide your affiliation",
				minlength: "Your affiliation must be at least 5 characters long"
			},
			phone: {
				minlength: "Please use a valid phone number",
			},
			email: "Please enter a valid email address"
		}
	});
	
	
});



$(function()
{
	$("#createStack").submit(function (e) {
		e.preventDefault();
		$(this).ajaxSubmit({                                                                                                                 
			error: function(a, b, c) {
				alert('err', a, b);
			},
			success: function(stack) {
				if (stack.error) return;
				var c = $("table#stacklist tbody").length+1;
				var txt = '\
<tr>\
<td class="center">'+c+'</td>\
<td><strong>' + stack.label + '</strong></td>\
<td>0</td>\
<td>' + stack.date + '</td>\
<td class="text-right">\
    <div class="btn-group btn-group-xs">\
    <a href="' + $url + '/app/stack/' + stack._id + '" class="btn btn-info"><i class="fa fa-eye"></i></a>'+
        //<a href="' + $url + '/app/sedit/' + stack._id + '" class="btn btn-inverse"><i class="fa fa-pencil"></i></a>\
        '<a href="' + $url + '/app/sdelete/' + stack._id + '" class="btn btn-danger"><i class="fa fa-times"></i></a>\
    </div>\
</td>\
</tr>';
				$("table#stacklist tbody").append(txt);
				$("div#alerts").hide(function () {
					$(this).html('<div class="alert alert-success"><button type="button" class="close" data-dismiss="alert">&times;</button><strong>Good News!</strong> Your stack has been created!</div>').slideDown('slow');
				});
			}
		});
		
	});
	// validate signup form on keyup and submit
	$("#createStack").validate({
		rules: {
			label: {
				required: true,
				minlength: 5
			}
		},
		messages: {
			label: {
				required: "Please enter the stack's name.",
				minlength: "Label must consist of at least 5 characters"
			}
		}
	});

	
});


$(function () {
	$('.note').each(function () {
		$(this).html($(this).html().split("&lt;br /&gt;").join("<br />"));
	});
	$(".edit-note").click(function (e) {
		e.preventDefault();
		var tag = $(this).parent().find("p.note");
		var data = tag.html().split("<br />").join("\n").split("<br>").join("\n");
		tag.after('<textarea style=\'height: 150px; margin-bottom:20px;\'>' + data + '</textarea>');
		$(this).parent().find("textarea").focus();
		tag.remove();
		$(this).hide();
		$(this).parent().find(".save-note").show();
	});

	$(".save-note").click(function (e) {
		e.preventDefault();
		var tag = $(this).parent().find("textarea");
		var data = tag.val().split("\n").join("<br />");
		tag.after('<p class=\'note\'>' + data + '</p>');
		tag.remove();
		$(this).hide();
		$(this).parent().find(".edit-note").html("Edit").show();
		$.post($url+'/app/p_update_note/'+$(this).parent().find('.cid').val()+'/'+$(this).parent().find('.sid').val(), {note: data}, function (d) {
		});
	});

})