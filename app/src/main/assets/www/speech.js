/* Shared speech for Space Words (Picture Planet and Sight Word Saucer) (plain ES5 for old Android WebViews).
   Uses recorded clips in audio/ when they exist, otherwise the device's text-to-speech. */
(function(){
"use strict";
var PHRASES = {"w_a":"a","w_and":"and","w_away":"away","w_big":"big","w_blue":"blue","w_can":"can","w_come":"come","s_come":"Can you come to my house?","w_down":"down","s_down":"The ball rolled down the hill.","w_find":"find","w_for":"for","w_funny":"funny","s_funny":"The clown is funny.","w_go":"go","w_help":"help","s_help":"Can you help me?","w_here":"here","w_i":"I","w_in":"in","w_is":"is","w_it":"it","w_jump":"jump","s_jump":"Frogs can jump high.","w_little":"little","s_little":"A little bug is on the leaf.","w_look":"look","w_make":"make","w_me":"me","w_my":"my","w_not":"not","w_one":"one","w_play":"play","s_play":"We like to play ball.","w_red":"red","w_run":"run","s_run":"The dog can run fast.","w_said":"said","s_said":"Mom said it is time for bed.","w_see":"see","s_see":"I can see a red ball.","w_the":"the","s_the":"I see the dog.","w_three":"three","w_to":"to","w_two":"two","s_two":"I have two hands.","w_up":"up","w_we":"we","w_where":"where","s_where":"Where is my hat?","w_yellow":"yellow","s_yellow":"The sun is big and yellow.","w_you":"you","w_all":"all","w_am":"am","w_are":"are","w_at":"at","w_ate":"ate","w_be":"be","w_black":"black","w_brown":"brown","w_but":"but","w_came":"came","w_did":"did","w_do":"do","w_eat":"eat","s_eat":"I like to eat apples.","w_four":"four","s_four":"A dog has four legs.","w_get":"get","w_good":"good","s_good":"This cake tastes good.","w_have":"have","w_he":"he","w_into":"into","w_like":"like","w_must":"must","w_new":"new","s_new":"I got new shoes.","w_no":"no","w_now":"now","w_on":"on","w_our":"our","w_out":"out","w_please":"please","s_please":"May I have a cookie, please?","w_pretty":"pretty","w_ran":"ran","w_ride":"ride","s_ride":"I can ride my bike.","w_saw":"saw","w_say":"say","w_she":"she","w_so":"so","w_soon":"soon","w_that":"that","w_there":"there","w_they":"they","s_they":"They are my friends.","w_this":"this","w_too":"too","w_under":"under","s_under":"The cat is under the bed.","w_want":"want","w_was":"was","s_was":"The cat was on the mat.","w_well":"well","w_went":"went","s_went":"We went to the park.","w_what":"what","s_what":"What is your name?","w_white":"white","w_who":"who","s_who":"Who is at the door?","w_will":"will","w_with":"with","s_with":"Come play with me.","w_yes":"yes","s_yes":"Can I go? yes, you can!","w_after":"after","w_again":"again","w_an":"an","w_any":"any","w_as":"as","w_ask":"ask","w_by":"by","w_could":"could","s_could":"I could not find my shoe.","w_every":"every","s_every":"I brush my teeth every day.","w_fly":"fly","s_fly":"Birds can fly.","w_from":"from","s_from":"This card is from Grandma.","w_give":"give","s_give":"Please give me the ball.","w_going":"going","w_had":"had","w_has":"has","w_her":"her","w_him":"him","w_his":"his","w_how":"how","s_how":"How old are you?","w_just":"just","w_know":"know","s_know":"I know how to swim.","w_let":"let","w_live":"live","w_may":"may","w_of":"of","w_old":"old","w_once":"once","s_once":"Once upon a time, there was a king.","w_open":"open","s_open":"Please open the door.","w_over":"over","w_put":"put","w_round":"round","w_some":"some","w_stop":"stop","s_stop":"Red means stop.","w_take":"take","w_thank":"thank","s_thank":"Thank you for the gift.","w_them":"them","w_then":"then","w_think":"think","w_walk":"walk","s_walk":"We walk the dog every day.","w_were":"were","s_were":"We were at the zoo.","w_when":"when","w_always":"always","s_always":"I always wash my hands before I eat.","w_around":"around","w_because":"because","s_because":"I wore a coat because it was cold.","w_been":"been","w_before":"before","w_best":"best","w_both":"both","w_buy":"buy","w_call":"call","w_cold":"cold","s_cold":"Ice is very cold.","w_does":"does","w_dont":"don't","s_dont":"Please don't touch the hot stove.","w_fast":"fast","w_first":"first","s_first":"I want to go first!","w_five":"five","w_found":"found","s_found":"I found my lost toy!","w_gave":"gave","w_goes":"goes","w_green":"green","s_green":"Grass is green.","w_its":"its","w_made":"made","w_many":"many","s_many":"How many cats do you have?","w_off":"off","w_or":"or","w_pull":"pull","w_read":"read","w_right":"right","w_sing":"sing","w_sit":"sit","w_sleep":"sleep","s_sleep":"I sleep in my bed.","w_tell":"tell","w_their":"their","s_their":"The kids put on their coats.","w_these":"these","w_those":"those","w_upon":"upon","w_us":"us","w_use":"use","w_very":"very","w_wash":"wash","w_which":"which","s_which":"Which one do you want?","w_why":"why","s_why":"Why is the sky blue?","w_wish":"wish","w_work":"work","w_would":"would","s_would":"Would you like some milk?","w_write":"write","s_write":"I can write my name.","w_your":"your","w_about":"about","w_better":"better","w_bring":"bring","w_carry":"carry","s_carry":"Can you help me carry this box?","w_clean":"clean","s_clean":"Please clean your room.","w_cut":"cut","w_done":"done","w_draw":"draw","w_drink":"drink","s_drink":"I drink milk at lunch.","w_eight":"eight","w_fall":"fall","w_far":"far","w_full":"full","w_got":"got","w_grow":"grow","s_grow":"Plants need water to grow.","w_hold":"hold","w_hot":"hot","w_hurt":"hurt","w_if":"if","w_keep":"keep","w_kind":"kind","w_laugh":"laugh","s_laugh":"Jokes make me laugh.","w_light":"light","s_light":"Turn on the light.","w_long":"long","w_much":"much","w_myself":"myself","s_myself":"I can tie my shoes by myself.","w_never":"never","s_never":"I will never give up.","w_only":"only","w_own":"own","w_pick":"pick","w_seven":"seven","w_shall":"shall","w_show":"show","w_six":"six","w_small":"small","w_start":"start","s_start":"The race will start soon.","w_ten":"ten","w_today":"today","s_today":"Today is my birthday!","w_together":"together","s_together":"We can play together.","w_try":"try","w_warm":"warm","s_warm":"The sun feels warm.","w_cat":"cat","w_dog":"dog","w_sun":"sun","w_bus":"bus","w_hat":"hat","w_pig":"pig","w_bed":"bed","w_bug":"bug","w_box":"box","w_fox":"fox","w_egg":"egg","w_map":"map","w_pen":"pen","w_web":"web","w_bat":"bat","w_van":"van","w_ant":"ant","w_frog":"frog","w_ship":"ship","w_fish":"fish","w_duck":"duck","w_crab":"crab","w_drum":"drum","w_star":"star","w_sock":"sock","w_chick":"chick","w_shell":"shell","w_truck":"truck","w_clock":"clock","w_flag":"flag","w_sled":"sled","w_ring":"ring","w_tent":"tent","w_milk":"milk","w_cake":"cake","w_kite":"kite","w_bike":"bike","w_rose":"rose","w_snail":"snail","w_train":"train","w_tree":"tree","w_bee":"bee","w_boat":"boat","w_goat":"goat","w_moon":"moon","w_snake":"snake","w_whale":"whale","w_cheese":"cheese","w_sheep":"sheep","w_house":"house","w_owl":"owl","w_bone":"bone","w_rain":"rain","w_rabbit":"rabbit","w_rocket":"rocket","w_pumpkin":"pumpkin","w_apple":"apple","w_tiger":"tiger","w_zebra":"zebra","w_pencil":"pencil","w_carrot":"carrot","w_robot":"robot","w_lemon":"lemon","w_monkey":"monkey","w_turtle":"turtle","w_candle":"candle","w_guitar":"guitar","w_balloon":"balloon","w_penguin":"penguin","w_dragon":"dragon","w_spider":"spider","w_cookie":"cookie","w_pizza":"pizza","w_butterfly":"butterfly","w_rainbow":"rainbow","w_snowman":"snowman","w_octopus":"octopus","w_elephant":"elephant","w_dinosaur":"dinosaur","w_umbrella":"umbrella","w_strawberry":"strawberry","w_pineapple":"pineapple","w_helicopter":"helicopter","w_telescope":"telescope","w_kangaroo":"kangaroo","w_crocodile":"crocodile","w_watermelon":"watermelon","w_sandwich":"sandwich","w_popcorn":"popcorn","w_sunflower":"sunflower","w_ladybug":"ladybug","w_cupcake":"cupcake","p_praise_0":"Great job!","p_praise_1":"You got it!","p_praise_2":"Super reading!","p_praise_3":"Awesome!","p_praise_4":"Yes!","p_praise_5":"Nice work!","p_space_0":"Beam it up!","p_space_1":"Out of this world!","p_space_2":"Great reading, space cadet!","p_space_3":"Blast off!","p_space_4":"You got it!","p_try":"Try again.","p_perfect":"Perfect! You read every word!","p_mission":"Mission complete!","p_spell":"Now spell it.","p_sound_on":"Talking is on.","p_hi":"Hi! Let's read some words.","p_stars_0":"You earned 0 stars!","p_stars_1":"You earned 1 star!","p_stars_2":"You earned 2 stars!","p_stars_3":"You earned 3 stars!","p_stars_4":"You earned 4 stars!","p_stars_5":"You earned 5 stars!","p_stars_6":"You earned 6 stars!","p_stars_7":"You earned 7 stars!","p_stars_8":"You earned 8 stars!","p_stars_9":"You earned 9 stars!","p_stars_10":"You earned 10 stars!","n_0":"zero","n_1":"one","n_2":"two","n_3":"three","n_4":"four","n_5":"five","n_6":"six","n_7":"seven","n_8":"eight","n_9":"nine","n_10":"ten","n_11":"eleven","n_12":"twelve","n_13":"thirteen","n_14":"fourteen","n_15":"fifteen","n_16":"sixteen","n_17":"seventeen","n_18":"eighteen","n_19":"nineteen","n_20":"twenty","n_21":"twenty-one","n_22":"twenty-two","n_23":"twenty-three","n_24":"twenty-four","n_25":"twenty-five","n_26":"twenty-six","n_27":"twenty-seven","n_28":"twenty-eight","n_29":"twenty-nine","n_30":"thirty","n_31":"thirty-one","n_32":"thirty-two","n_33":"thirty-three","n_34":"thirty-four","n_35":"thirty-five","n_36":"thirty-six","n_37":"thirty-seven","n_38":"thirty-eight","n_39":"thirty-nine","n_40":"forty","n_41":"forty-one","n_42":"forty-two","n_43":"forty-three","n_44":"forty-four","n_45":"forty-five","n_46":"forty-six","n_47":"forty-seven","n_48":"forty-eight","n_49":"forty-nine","n_50":"fifty","n_51":"fifty-one","n_52":"fifty-two","n_53":"fifty-three","n_54":"fifty-four","n_55":"fifty-five","n_56":"fifty-six","n_57":"fifty-seven","n_58":"fifty-eight","n_59":"fifty-nine","n_60":"sixty","n_61":"sixty-one","n_62":"sixty-two","n_63":"sixty-three","n_64":"sixty-four","n_65":"sixty-five","n_66":"sixty-six","n_67":"sixty-seven","n_68":"sixty-eight","n_69":"sixty-nine","n_70":"seventy","n_71":"seventy-one","n_72":"seventy-two","n_73":"seventy-three","n_74":"seventy-four","n_75":"seventy-five","n_76":"seventy-six","n_77":"seventy-seven","n_78":"seventy-eight","n_79":"seventy-nine","n_80":"eighty","n_81":"eighty-one","n_82":"eighty-two","n_83":"eighty-three","n_84":"eighty-four","n_85":"eighty-five","n_86":"eighty-six","n_87":"eighty-seven","n_88":"eighty-eight","n_89":"eighty-nine","n_90":"ninety","n_91":"ninety-one","n_92":"ninety-two","n_93":"ninety-three","n_94":"ninety-four","n_95":"ninety-five","n_96":"ninety-six","n_97":"ninety-seven","n_98":"ninety-eight","n_99":"ninety-nine","n_100":"one hundred","m_how_many":"How many?","m_find_group":"Tap the group with","m_more":"Which group has more?","m_fewer":"Which group has fewer?","m_bigger":"Which number is bigger?","m_smaller":"Which number is smaller?","m_after":"What comes after","m_before":"What comes before","m_between":"What number is between","m_and":"and","m_ten_more":"What is ten more than","m_ten_less":"What is ten less than","m_what_number":"What number is this?","m_what_is":"What is","m_plus":"plus","m_minus":"minus","m_times":"times","m_div":"divided by","m_groups_of":"groups of","m_in_all":"How many in all?","m_missing":"What number is missing?","m_next":"What comes next?","m_type":"Type the answer.","m_answer_is":"The answer is","m_praise_0":"Great math!","m_praise_1":"Math star!","m_praise_2":"Correct!","m_praise_3":"Super smart!","m_praise_4":"Nice thinking!","m_praise_5":"You're a math whiz!","i_pic":"Read the word. Tap its picture.","i_listen":"Listen, then tap the word you hear.","i_build":"Tap the letters to spell it.","i_beam":"Listen, then beam up the word you hear.","i_sentence":"Read the sentence. Which word fits?","i_look":"Look at the word, then spell it.","w_bear":"bear","w_belly":"belly","w_bite":"bite","w_bun":"bun","w_bunny":"bunny","w_cable":"cable","w_cap":"cap","w_chair":"chair","w_clap":"clap","w_coat":"coat","w_cone":"cone","w_cube":"cube","w_cuddle":"cuddle","w_cup":"cup","w_day":"day","w_dig":"dig","w_door":"door","w_fan":"fan","w_fed":"fed","w_flower":"flower","w_fun":"fun","w_game":"game","w_giggle":"giggle","w_hair":"hair","w_handle":"handle","w_head":"head","w_hen":"hen","w_hide":"hide","w_hit":"hit","w_honey":"honey","w_hop":"hop","w_hug":"hug","w_jelly":"jelly","w_jet":"jet","w_jog":"jog","w_key":"key","w_kitten":"kitten","w_lake":"lake","w_letter":"letter","w_lip":"lip","w_log":"log","w_man":"man","w_mat":"mat","w_meat":"meat","w_men":"men","w_mitten":"mitten","w_money":"money","w_mop":"mop","w_mug":"mug","w_name":"name","w_nap":"nap","w_net":"net","w_night":"night","w_nose":"nose","w_note":"note","w_parrot":"parrot","w_pear":"pear","w_pie":"pie","w_plane":"plane","w_plate":"plate","w_plum":"plum","w_pocket":"pocket","w_pop":"pop","w_pot":"pot","w_puddle":"puddle","w_pup":"pup","w_rug":"rug","w_seat":"seat","w_shoe":"shoe","w_snow":"snow","w_sweater":"sweater","w_table":"table","w_top":"top","w_tower":"tower","w_tube":"tube","w_wig":"wig","w_wiggle":"wiggle","w_zoo":"zoo","i_connect":"Tap a word, then tap its picture.","i_rhyme":"Tap a word, then tap the word that rhymes with it.","p_rhyme_0":"They rhyme!","p_rhyme_1":"Rhyme time!","p_rhyme_2":"You found a rhyme!","p_board":"Board complete!","m_equals":"equals","w_aliens":"aliens","w_apples":"apples","w_ball":"ball","w_balloons":"balloons","w_beam":"beam","w_between":"between","w_bigger":"bigger","w_birds":"birds","w_birthday":"birthday","w_brush":"brush","w_card":"card","w_cats":"cats","w_clown":"clown","w_coats":"coats","w_comes":"comes","w_cookies":"cookies","w_feels":"feels","w_fewer":"fewer","w_fits":"fits","w_flying":"flying","w_friends":"friends","w_frogs":"frogs","w_gift":"gift","w_grandma":"Grandma","w_grass":"grass","w_group":"group","w_groups":"groups","w_hands":"hands","w_hear":"hear","w_high":"high","w_hill":"hill","w_ice":"ice","w_jokes":"jokes","w_kids":"kids","w_king":"king","w_ladybugs":"ladybugs","w_leaf":"leaf","w_legs":"legs","w_less":"less","w_letters":"letters","w_listen":"listen","w_lost":"lost","w_lunch":"lunch","w_means":"means","w_missing":"missing","w_mom":"Mom","w_moons":"moons","w_more":"more","w_need":"need","w_next":"next","w_number":"number","w_park":"park","w_picture":"picture","w_planets":"planets","w_plants":"plants","w_race":"race","w_rhymes":"rhymes","w_rockets":"rockets","w_rolled":"rolled","w_room":"room","w_rule":"rule","w_satellites":"satellites","w_saucers":"saucers","w_sentence":"sentence","w_shoes":"shoes","w_shooting":"shooting","w_sky":"sky","w_smaller":"smaller","w_spell":"spell","w_stars":"stars","w_stove":"stove","w_swim":"swim","w_tap":"tap","w_tastes":"tastes","w_teeth":"teeth","w_than":"than","w_tie":"tie","w_time":"time","w_touch":"touch","w_toy":"toy","w_turn":"turn","w_water":"water","w_word":"word","w_wore":"wore","v_a_short":"Short A, like in cat.","v_a_long":"Long A, like in cake.","v_e_short":"Short E, like in bed.","v_e_long":"Long E, like in bee.","v_i_short":"Short I, like in pig.","v_i_long":"Long I, like in kite.","v_o_short":"Short O, like in dog.","v_o_long":"Long O, like in rose.","v_u_short":"Short U, like in bug.","v_u_long":"Long U, like in cube.","x_silent_e":"The E is silent. It makes the vowel say its name.","t_ai":"A and I together say the long A sound, like in rain.","t_ay":"A and Y together say the long A sound, like in day.","t_ee":"Two E's together say the long E sound, like in tree.","t_ea":"E and A together say the long E sound, like in eat.","t_oa":"O and A together say the long O sound, like in boat.","t_ow":"O and W together say the long O sound, like in snow.","t_igh":"I, G, H together say the long I sound, like in night.","t_ie":"I and E together say the long I sound, like in pie.","t_ue":"U and E together say the long U sound, like in blue.","r_ar":"A and R say are, like in car.","r_or":"O and R say or, like in fork.","r_er":"E R, I R, and U R all say err, like in her, bird, and turn.","i_swap":"Tap a vowel to make the word you hear.","i_vowel":"Which vowel sound do you hear?","i_which":"Which word do you hear?","i_shortlong":"Is the vowel sound short or long?","i_team":"Tap the letters that make the vowel sound.","i_syll":"How many syllables? Clap and count!","i_r":"Which bossy R sound do you hear?","sy_cat":"cat","sy_dog":"dog","sy_sun":"sun","sy_fish":"fish","sy_frog":"frog","sy_ship":"ship","sy_rab":"rab","sy_bit":"bit","sy_pump":"pump","sy_kin":"kin","sy_rock":"rock","sy_it":"it","sy_cup":"cup","sy_cake":"cake","sy_set":"set","sy_pick":"pick","sy_nick":"nick","sy_hot":"hot","sy_mag":"mag","sy_nit":"nit","sy_kit":"kit","sy_nap":"nap","sy_but":"but","sy_ter":"ter","sy_fly":"fly","sy_ell":"ell","sy_uh":"uh","sy_fent":"fent","sy_ock":"ock","sy_tuh":"tuh","sy_puss":"puss","sy_um":"um","sy_brell":"brell","sy_tell":"tell","sy_scope":"scope","sy_wah":"wah","sy_mel":"mel","sy_un":"un","sy_mack":"mack","sy_row":"row","sy_nee":"nee","sy_al":"al","sy_gay":"gay","sy_er":"er","sy_pill":"pill","w_alligator":"alligator","w_bad":"bad","w_bag":"bag","w_banana":"banana","w_beg":"beg","w_bid":"bid","w_bird":"bird","w_bit":"bit","w_bog":"bog","w_bossy":"bossy","w_bud":"bud","w_burn":"burn","w_cape":"cape","w_car":"car","w_caterpillar":"caterpillar","w_corn":"corn","w_cot":"cot","w_count":"count","w_cub":"cub","w_cute":"cute","w_dug":"dug","w_e":"E","w_each":"each","w_farm":"farm","w_fern":"fern","w_fin":"fin","w_fork":"fork","w_girl":"girl","w_glue":"glue","w_ham":"ham","w_hate":"hate","w_hope":"hope","w_horn":"horn","w_hotdog":"hot dog","w_hum":"hum","w_hut":"hut","w_jar":"jar","w_kit":"kit","w_lag":"lag","w_leg":"leg","w_macaroni":"macaroni","w_mad":"mad","w_magic":"magic","w_magnet":"magnet","w_makes":"makes","w_napkin":"napkin","w_nurse":"nurse","w_pail":"pail","w_pan":"pan","w_part":"part","w_pat":"pat","w_pet":"pet","w_picnic":"picnic","w_pin":"pin","w_pine":"pine","w_pit":"pit","w_r":"R","w_rag":"rag","w_rig":"rig","w_rod":"rod","w_rode":"rode","w_sat":"sat","w_seed":"seed","w_set":"set","w_shark":"shark","w_shirt":"shirt","w_short":"short","w_silent":"silent","w_sound":"sound","w_storm":"storm","w_sunset":"sunset","w_syllables":"syllables","w_tape":"tape","w_tip":"tip","w_tub":"tub","w_vowel":"vowel","i_cpic":"Pick the word that finishes the compound word.","i_cwhich":"Which one is a compound word?","i_cmatch":"Match the halves to make compound words.","i_csplit":"Tap between the letters to split it into two words.","i_cbuild":"Pick the word that makes a compound word. Start with","w_afternoon":"afternoon","w_air":"air","w_airplane":"airplane","w_anything":"anything","w_back":"back","w_backpack":"backpack","w_base":"base","w_baseball":"baseball","w_basket":"basket","w_basketball":"basketball","w_bath":"bath","w_bathroom":"bathroom","w_bathtub":"bathtub","w_bedroom":"bedroom","w_bell":"bell","w_berry":"berry","w_birdhouse":"birdhouse","w_birth":"birth","w_board":"board","w_body":"body","w_book":"book","w_bow":"bow","w_boy":"boy","w_bucket":"bucket","w_butter":"butter","w_button":"button","w_camp":"camp","w_campfire":"campfire","w_class":"class","w_classmate":"classmate","w_classroom":"classroom","w_cow":"cow","w_cowboy":"cowboy","w_cupboard":"cupboard","w_cycle":"cycle","w_doctor":"doctor","w_doghouse":"doghouse","w_doorbell":"doorbell","w_drop":"drop","w_drumstick":"drumstick","w_ear":"ear","w_earring":"earring","w_end":"end","w_everything":"everything","w_eye":"eye","w_eyeball":"eyeball","w_farmhouse":"farmhouse","w_father":"father","w_fighter":"fighter","w_finger":"finger","w_fingernail":"fingernail","w_fire":"fire","w_firefighter":"firefighter","w_firefly":"firefly","w_firetruck":"firetruck","w_fireworks":"fireworks","w_flake":"flake","w_foot":"foot","w_football":"football","w_garden":"garden","w_giant":"giant","w_glasses":"glasses","w_gold":"gold","w_goldfish":"goldfish","w_grand":"grand","w_grandfather":"grandfather","w_grandmother":"grandmother","w_grasshopper":"grasshopper","w_ground":"ground","w_haircut":"haircut","w_hand":"hand","w_handbag":"handbag","w_happy":"happy","w_headlight":"headlight","w_helmet":"helmet","w_home":"home","w_homework":"homework","w_hopper":"hopper","w_horse":"horse","w_horseshoe":"horseshoe","w_jacket":"jacket","w_jellyfish":"jellyfish","w_keyboard":"keyboard","w_lady":"lady","w_lunchbox":"lunchbox","w_mail":"mail","w_mailbox":"mailbox","w_mate":"mate","w_melon":"melon","w_moonlight":"moonlight","w_mother":"mother","w_motor":"motor","w_motorcycle":"motorcycle","w_nail":"nail","w_news":"news","w_newspaper":"newspaper","w_nightlight":"nightlight","w_noon":"noon","w_notebook":"notebook","w_pack":"pack","w_paint":"paint","w_paintbrush":"paintbrush","w_pancake":"pancake","w_paper":"paper","w_paste":"paste","w_playground":"playground","w_police":"police","w_policeman":"policeman","w_purple":"purple","w_raincoat":"raincoat","w_raindrop":"raindrop","w_sail":"sail","w_sailboat":"sailboat","w_sand":"sand","w_sandbox":"sandbox","w_sea":"sea","w_seashell":"seashell","w_shine":"shine","w_sister":"sister","w_skate":"skate","w_skateboard":"skateboard","w_snowball":"snowball","w_snowflake":"snowflake","w_somebody":"somebody","w_starfish":"starfish","w_starlight":"starlight","w_stick":"stick","w_straw":"straw","w_summer":"summer","w_sunglasses":"sunglasses","w_sunshine":"sunshine","w_tea":"tea","w_teapot":"teapot","w_thing":"thing","w_thunder":"thunder","w_thunderstorm":"thunderstorm","w_tooth":"tooth","w_toothbrush":"toothbrush","w_toothpaste":"toothpaste","w_week":"week","w_weekend":"weekend","w_window":"window","w_winter":"winter","w_works":"works","w_finishes":"finishes","w_compound":"compound","w_match":"match","w_halves":"halves","w_words":"words","w_split":"split","sy_tin":"tin","sy_bah":"bah","sy_nah":"nah","sy_nuh":"nuh","sy_luh":"luh","sy_lih":"lih","sy_ler":"ler","cs_i":"I can jump.","cs_a":"I see a red ball.","cs_the":"Look at the moon.","cs_to":"We go to the park.","cs_play":"We like to play.","cs_see":"I see a star.","cs_for":"This is for you.","cs_like":"I like my cat.","cs_have":"I have a dog.","cs_you":"I love you.","cs_who":"Who is at the door?","cs_what":"What is that?","cs_where":"Where is my hat?","cs_go":"We go up in a rocket.","cs_so":"I am so happy.","cs_look":"Look at me!","cs_want":"I want to play.","cs_come":"Come with me.","cs_said":"Mom said yes.","cs_saw":"I saw a frog.","cs_be":"I will be good.","cs_she":"She can run fast.","cs_he":"He is my friend.","cs_we":"We can help.","cs_me":"Play with me.","cs_black":"The cat is black.","cs_blue":"The sky is blue.","cs_brown":"The dog is brown.","cs_yellow":"The sun is yellow.","cs_are":"We are friends.","cs_little":"I see a little bug.","cs_with":"Come play with me.","cs_find":"Can you find my shoe?","cs_no":"No, thank you.","cs_they":"They like to jump.","cs_help":"Can you help me?","cs_jump":"I can jump high.","cs_was":"It was fun.","cs_will":"I will go to bed.","cs_went":"We went to the zoo.","cs_that":"I want that one.","cs_this":"This is my book.","cs_there":"There is a moon.","cs_do":"What do you see?","cs_my":"This is my mom.","cs_too":"I want to come too.","cs_am":"I am five.","cs_down":"Sit down, please.","cs_must":"We must go now.","cs_can":"I can read!","cs_at":"Look at the stars.","cs_now":"Come here now.","cs_well":"She can sing well.","cs_new":"I have a new hat.","cs_not":"I am not sad.","cs_all":"We all like cake.","cs_good":"That was good.","cs_sat":"The cat sat down.","cs_our":"This is our house.","cs_out":"The dog went out.","cs_eat":"We eat lunch.","cs_soon":"We will go soon.","cs_please":"Please help me.","cs_ride":"I can ride a bike.","cs_white":"The snow is white.","cs_pretty":"The flower is pretty.","cs_funny":"The clown is funny.","cs_away":"The bird flew away.","cs_came":"My friend came over.","i_cw_find":"Find the word you hear.","i_cw_teach":"Zib the alien is learning to read. Is Zib right?","z_think":"I think this word says","z_yay":"Yay! I got it right!","z_thanks":"Oops! Thank you for teaching me!","p_it_says":"It says","p_listen_zib":"Listen to Zib again.","i_cw_hunt":"Word hunt! Tap every word that says","p_that_says":"That word says","i_cw_write":"Trace the word with your finger. Use lots of colors!","p_rainbow":"Beautiful rainbow writing!","i_cw_roll":"Roll the die! Read the word that many times. Try silly voices!","p_times":"times!","i_cw_say":"Say the word. Then use it in a sentence!","p_good_sentence":"Great sentence!","w_love":"love","w_friend":"friend","w_sad":"sad","w_flew":"flew","w_zib":"Zib","w_alien":"alien","w_learning":"learning","w_hunt":"hunt","w_trace":"trace","w_lots":"lots","w_colors":"colors","w_roll":"roll","w_die":"die","w_times":"times","w_silly":"silly","w_voices":"voices","m_rule":"The rule is","m_then":"then","m_rule_grow":"Each jump is one bigger!","m_rule_square":"These are square numbers. Each one is a number times itself!","m_rule_repeat":"The pattern repeats!","ws_a":"a","ws_and":"and","ws_away":"away","ws_big":"big","ws_blue":"blue","ws_can":"can","ws_come":"come","ws_down":"down","ws_find":"find","ws_for":"for","ws_funny":"funny","ws_go":"go","ws_help":"help","ws_here":"here","ws_i":"I","ws_in":"in","ws_is":"is","ws_it":"it","ws_jump":"jump","ws_little":"little","ws_look":"look","ws_make":"make","ws_me":"me","ws_my":"my","ws_not":"not","ws_one":"one","ws_play":"play","ws_red":"red","ws_run":"run","ws_said":"said","ws_see":"see","ws_the":"the","ws_three":"three","ws_to":"to","ws_two":"two","ws_up":"up","ws_we":"we","ws_where":"where","ws_yellow":"yellow","ws_you":"you","ws_all":"all","ws_am":"am","ws_are":"are","ws_at":"at","ws_ate":"ate","ws_be":"be","ws_black":"black","ws_brown":"brown","ws_but":"but","ws_came":"came","ws_did":"did","ws_do":"do","ws_eat":"eat","ws_four":"four","ws_get":"get","ws_good":"good","ws_have":"have","ws_he":"he","ws_into":"into","ws_like":"like","ws_must":"must","ws_new":"new","ws_no":"no","ws_now":"now","ws_on":"on","ws_our":"our","ws_out":"out","ws_please":"please","ws_pretty":"pretty","ws_ran":"ran","ws_ride":"ride","ws_saw":"saw","ws_say":"say","ws_she":"she","ws_so":"so","ws_soon":"soon","ws_that":"that","ws_there":"there","ws_they":"they","ws_this":"this","ws_too":"too","ws_under":"under","ws_want":"want","ws_was":"was","ws_well":"well","ws_went":"went","ws_what":"what","ws_white":"white","ws_who":"who","ws_will":"will","ws_with":"with","ws_yes":"yes","ws_after":"after","ws_again":"again","ws_an":"an","ws_any":"any","ws_as":"as","ws_ask":"ask","ws_by":"by","ws_could":"could","ws_every":"every","ws_fly":"fly","ws_from":"from","ws_give":"give","ws_going":"going","ws_had":"had","ws_has":"has","ws_her":"her","ws_him":"him","ws_his":"his","ws_how":"how","ws_just":"just","ws_know":"know","ws_let":"let","ws_live":"live","ws_may":"may","ws_of":"of","ws_old":"old","ws_once":"once","ws_open":"open","ws_over":"over","ws_put":"put","ws_round":"round","ws_some":"some","ws_stop":"stop","ws_take":"take","ws_thank":"thank","ws_them":"them","ws_then":"then","ws_think":"think","ws_walk":"walk","ws_were":"were","ws_when":"when","ws_always":"always","ws_around":"around","ws_because":"because","ws_been":"been","ws_before":"before","ws_best":"best","ws_both":"both","ws_buy":"buy","ws_call":"call","ws_cold":"cold","ws_does":"does","ws_dont":"don't","ws_fast":"fast","ws_first":"first","ws_five":"five","ws_found":"found","ws_gave":"gave","ws_goes":"goes","ws_green":"green","ws_its":"its","ws_made":"made","ws_many":"many","ws_off":"off","ws_or":"or","ws_pull":"pull","ws_read":"read","ws_right":"right","ws_sing":"sing","ws_sit":"sit","ws_sleep":"sleep","ws_tell":"tell","ws_their":"their","ws_these":"these","ws_those":"those","ws_upon":"upon","ws_us":"us","ws_use":"use","ws_very":"very","ws_wash":"wash","ws_which":"which","ws_why":"why","ws_wish":"wish","ws_work":"work","ws_would":"would","ws_write":"write","ws_your":"your","ws_about":"about","ws_better":"better","ws_bring":"bring","ws_carry":"carry","ws_clean":"clean","ws_cut":"cut","ws_done":"done","ws_draw":"draw","ws_drink":"drink","ws_eight":"eight","ws_fall":"fall","ws_far":"far","ws_full":"full","ws_got":"got","ws_grow":"grow","ws_hold":"hold","ws_hot":"hot","ws_hurt":"hurt","ws_if":"if","ws_keep":"keep","ws_kind":"kind","ws_laugh":"laugh","ws_light":"light","ws_long":"long","ws_much":"much","ws_myself":"myself","ws_never":"never","ws_only":"only","ws_own":"own","ws_pick":"pick","ws_seven":"seven","ws_shall":"shall","ws_show":"show","ws_six":"six","ws_small":"small","ws_start":"start","ws_ten":"ten","ws_today":"today","ws_together":"together","ws_try":"try","ws_warm":"warm","ws_cat":"cat","ws_dog":"dog","ws_sun":"sun","ws_bus":"bus","ws_hat":"hat","ws_pig":"pig","ws_bed":"bed","ws_bug":"bug","ws_box":"box","ws_fox":"fox","ws_egg":"egg","ws_map":"map","ws_pen":"pen","ws_web":"web","ws_bat":"bat","ws_van":"van","ws_ant":"ant","ws_frog":"frog","ws_ship":"ship","ws_fish":"fish","ws_duck":"duck","ws_crab":"crab","ws_drum":"drum","ws_star":"star","ws_sock":"sock","ws_chick":"chick","ws_shell":"shell","ws_truck":"truck","ws_clock":"clock","ws_flag":"flag","ws_sled":"sled","ws_ring":"ring","ws_tent":"tent","ws_milk":"milk","ws_cake":"cake","ws_kite":"kite","ws_bike":"bike","ws_rose":"rose","ws_snail":"snail","ws_train":"train","ws_tree":"tree","ws_bee":"bee","ws_boat":"boat","ws_goat":"goat","ws_moon":"moon","ws_snake":"snake","ws_whale":"whale","ws_cheese":"cheese","ws_sheep":"sheep","ws_house":"house","ws_owl":"owl","ws_bone":"bone","ws_rain":"rain","ws_rabbit":"rabbit","ws_rocket":"rocket","ws_pumpkin":"pumpkin","ws_apple":"apple","ws_tiger":"tiger","ws_zebra":"zebra","ws_pencil":"pencil","ws_carrot":"carrot","ws_robot":"robot","ws_lemon":"lemon","ws_monkey":"monkey","ws_turtle":"turtle","ws_candle":"candle","ws_guitar":"guitar","ws_balloon":"balloon","ws_penguin":"penguin","ws_dragon":"dragon","ws_spider":"spider","ws_cookie":"cookie","ws_pizza":"pizza","ws_butterfly":"butterfly","ws_rainbow":"rainbow","ws_snowman":"snowman","ws_octopus":"octopus","ws_elephant":"elephant","ws_dinosaur":"dinosaur","ws_umbrella":"umbrella","ws_strawberry":"strawberry","ws_pineapple":"pineapple","ws_helicopter":"helicopter","ws_telescope":"telescope","ws_kangaroo":"kangaroo","ws_crocodile":"crocodile","ws_watermelon":"watermelon","ws_sandwich":"sandwich","ws_popcorn":"popcorn","ws_sunflower":"sunflower","ws_ladybug":"ladybug","ws_cupcake":"cupcake","ws_bear":"bear","ws_belly":"belly","ws_bite":"bite","ws_bun":"bun","ws_bunny":"bunny","ws_cable":"cable","ws_cap":"cap","ws_chair":"chair","ws_clap":"clap","ws_coat":"coat","ws_cone":"cone","ws_cube":"cube","ws_cuddle":"cuddle","ws_cup":"cup","ws_day":"day","ws_dig":"dig","ws_door":"door","ws_fan":"fan","ws_fed":"fed","ws_flower":"flower","ws_fun":"fun","ws_game":"game","ws_giggle":"giggle","ws_hair":"hair","ws_handle":"handle","ws_head":"head","ws_hen":"hen","ws_hide":"hide","ws_hit":"hit","ws_honey":"honey","ws_hop":"hop","ws_hug":"hug","ws_jelly":"jelly","ws_jet":"jet","ws_jog":"jog","ws_key":"key","ws_kitten":"kitten","ws_lake":"lake","ws_letter":"letter","ws_lip":"lip","ws_log":"log","ws_man":"man","ws_mat":"mat","ws_meat":"meat","ws_men":"men","ws_mitten":"mitten","ws_money":"money","ws_mop":"mop","ws_mug":"mug","ws_name":"name","ws_nap":"nap","ws_net":"net","ws_night":"night","ws_nose":"nose","ws_note":"note","ws_parrot":"parrot","ws_pear":"pear","ws_pie":"pie","ws_plane":"plane","ws_plate":"plate","ws_plum":"plum","ws_pocket":"pocket","ws_pop":"pop","ws_pot":"pot","ws_puddle":"puddle","ws_pup":"pup","ws_rug":"rug","ws_seat":"seat","ws_shoe":"shoe","ws_snow":"snow","ws_sweater":"sweater","ws_table":"table","ws_top":"top","ws_tower":"tower","ws_tube":"tube","ws_wig":"wig","ws_wiggle":"wiggle","ws_zoo":"zoo","ws_aliens":"aliens","ws_apples":"apples","ws_ball":"ball","ws_balloons":"balloons","ws_beam":"beam","ws_between":"between","ws_bigger":"bigger","ws_birds":"birds","ws_birthday":"birthday","ws_brush":"brush","ws_card":"card","ws_cats":"cats","ws_clown":"clown","ws_coats":"coats","ws_comes":"comes","ws_cookies":"cookies","ws_feels":"feels","ws_fewer":"fewer","ws_fits":"fits","ws_flying":"flying","ws_friends":"friends","ws_frogs":"frogs","ws_gift":"gift","ws_grandma":"Grandma","ws_grass":"grass","ws_group":"group","ws_groups":"groups","ws_hands":"hands","ws_hear":"hear","ws_high":"high","ws_hill":"hill","ws_ice":"ice","ws_jokes":"jokes","ws_kids":"kids","ws_king":"king","ws_ladybugs":"ladybugs","ws_leaf":"leaf","ws_legs":"legs","ws_less":"less","ws_letters":"letters","ws_listen":"listen","ws_lost":"lost","ws_lunch":"lunch","ws_means":"means","ws_missing":"missing","ws_mom":"Mom","ws_moons":"moons","ws_more":"more","ws_need":"need","ws_next":"next","ws_number":"number","ws_park":"park","ws_picture":"picture","ws_planets":"planets","ws_plants":"plants","ws_race":"race","ws_rhymes":"rhymes","ws_rockets":"rockets","ws_rolled":"rolled","ws_room":"room","ws_rule":"rule","ws_satellites":"satellites","ws_saucers":"saucers","ws_sentence":"sentence","ws_shoes":"shoes","ws_shooting":"shooting","ws_sky":"sky","ws_smaller":"smaller","ws_spell":"spell","ws_stars":"stars","ws_stove":"stove","ws_swim":"swim","ws_tap":"tap","ws_tastes":"tastes","ws_teeth":"teeth","ws_than":"than","ws_tie":"tie","ws_time":"time","ws_touch":"touch","ws_toy":"toy","ws_turn":"turn","ws_water":"water","ws_word":"word","ws_wore":"wore","ws_alligator":"alligator","ws_bad":"bad","ws_bag":"bag","ws_banana":"banana","ws_beg":"beg","ws_bid":"bid","ws_bird":"bird","ws_bit":"bit","ws_bog":"bog","ws_bossy":"bossy","ws_bud":"bud","ws_burn":"burn","ws_cape":"cape","ws_car":"car","ws_caterpillar":"caterpillar","ws_corn":"corn","ws_cot":"cot","ws_count":"count","ws_cub":"cub","ws_cute":"cute","ws_dug":"dug","ws_e":"E","ws_each":"each","ws_farm":"farm","ws_fern":"fern","ws_fin":"fin","ws_fork":"fork","ws_girl":"girl","ws_glue":"glue","ws_ham":"ham","ws_hate":"hate","ws_hope":"hope","ws_horn":"horn","ws_hotdog":"hot dog","ws_hum":"hum","ws_hut":"hut","ws_jar":"jar","ws_kit":"kit","ws_lag":"lag","ws_leg":"leg","ws_macaroni":"macaroni","ws_mad":"mad","ws_magic":"magic","ws_magnet":"magnet","ws_makes":"makes","ws_napkin":"napkin","ws_nurse":"nurse","ws_pail":"pail","ws_pan":"pan","ws_part":"part","ws_pat":"pat","ws_pet":"pet","ws_picnic":"picnic","ws_pin":"pin","ws_pine":"pine","ws_pit":"pit","ws_r":"R","ws_rag":"rag","ws_rig":"rig","ws_rod":"rod","ws_rode":"rode","ws_sat":"sat","ws_seed":"seed","ws_set":"set","ws_shark":"shark","ws_shirt":"shirt","ws_short":"short","ws_silent":"silent","ws_sound":"sound","ws_storm":"storm","ws_sunset":"sunset","ws_syllables":"syllables","ws_tape":"tape","ws_tip":"tip","ws_tub":"tub","ws_vowel":"vowel","ws_afternoon":"afternoon","ws_air":"air","ws_airplane":"airplane","ws_anything":"anything","ws_back":"back","ws_backpack":"backpack","ws_base":"base","ws_baseball":"baseball","ws_basket":"basket","ws_basketball":"basketball","ws_bath":"bath","ws_bathroom":"bathroom","ws_bathtub":"bathtub","ws_bedroom":"bedroom","ws_bell":"bell","ws_berry":"berry","ws_birdhouse":"birdhouse","ws_birth":"birth","ws_board":"board","ws_body":"body","ws_book":"book","ws_bow":"bow","ws_boy":"boy","ws_bucket":"bucket","ws_butter":"butter","ws_button":"button","ws_camp":"camp","ws_campfire":"campfire","ws_class":"class","ws_classmate":"classmate","ws_classroom":"classroom","ws_cow":"cow","ws_cowboy":"cowboy","ws_cupboard":"cupboard","ws_cycle":"cycle","ws_doctor":"doctor","ws_doghouse":"doghouse","ws_doorbell":"doorbell","ws_drop":"drop","ws_drumstick":"drumstick","ws_ear":"ear","ws_earring":"earring","ws_end":"end","ws_everything":"everything","ws_eye":"eye","ws_eyeball":"eyeball","ws_farmhouse":"farmhouse","ws_father":"father","ws_fighter":"fighter","ws_finger":"finger","ws_fingernail":"fingernail","ws_fire":"fire","ws_firefighter":"firefighter","ws_firefly":"firefly","ws_firetruck":"firetruck","ws_fireworks":"fireworks","ws_flake":"flake","ws_foot":"foot","ws_football":"football","ws_garden":"garden","ws_giant":"giant","ws_glasses":"glasses","ws_gold":"gold","ws_goldfish":"goldfish","ws_grand":"grand","ws_grandfather":"grandfather","ws_grandmother":"grandmother","ws_grasshopper":"grasshopper","ws_ground":"ground","ws_haircut":"haircut","ws_hand":"hand","ws_handbag":"handbag","ws_happy":"happy","ws_headlight":"headlight","ws_helmet":"helmet","ws_home":"home","ws_homework":"homework","ws_hopper":"hopper","ws_horse":"horse","ws_horseshoe":"horseshoe","ws_jacket":"jacket","ws_jellyfish":"jellyfish","ws_keyboard":"keyboard","ws_lady":"lady","ws_lunchbox":"lunchbox","ws_mail":"mail","ws_mailbox":"mailbox","ws_mate":"mate","ws_melon":"melon","ws_moonlight":"moonlight","ws_mother":"mother","ws_motor":"motor","ws_motorcycle":"motorcycle","ws_nail":"nail","ws_news":"news","ws_newspaper":"newspaper","ws_nightlight":"nightlight","ws_noon":"noon","ws_notebook":"notebook","ws_pack":"pack","ws_paint":"paint","ws_paintbrush":"paintbrush","ws_pancake":"pancake","ws_paper":"paper","ws_paste":"paste","ws_playground":"playground","ws_police":"police","ws_policeman":"policeman","ws_purple":"purple","ws_raincoat":"raincoat","ws_raindrop":"raindrop","ws_sail":"sail","ws_sailboat":"sailboat","ws_sand":"sand","ws_sandbox":"sandbox","ws_sea":"sea","ws_seashell":"seashell","ws_shine":"shine","ws_sister":"sister","ws_skate":"skate","ws_skateboard":"skateboard","ws_snowball":"snowball","ws_snowflake":"snowflake","ws_somebody":"somebody","ws_starfish":"starfish","ws_starlight":"starlight","ws_stick":"stick","ws_straw":"straw","ws_summer":"summer","ws_sunglasses":"sunglasses","ws_sunshine":"sunshine","ws_tea":"tea","ws_teapot":"teapot","ws_thing":"thing","ws_thunder":"thunder","ws_thunderstorm":"thunderstorm","ws_tooth":"tooth","ws_toothbrush":"toothbrush","ws_toothpaste":"toothpaste","ws_week":"week","ws_weekend":"weekend","ws_window":"window","ws_winter":"winter","ws_works":"works","ws_finishes":"finishes","ws_compound":"compound","ws_match":"match","ws_halves":"halves","ws_words":"words","ws_split":"split","ws_love":"love","ws_friend":"friend","ws_sad":"sad","ws_flew":"flew","ws_zib":"Zib","ws_alien":"alien","ws_learning":"learning","ws_hunt":"hunt","ws_trace":"trace","ws_lots":"lots","ws_colors":"colors","ws_roll":"roll","ws_die":"die","ws_times":"times","ws_silly":"silly","ws_voices":"voices","p_switch_turns":"Time's up! Switch turns!","p_your_turn":"Your turn!","p_minutes":"minutes.","p_minute":"minute.","p_have_fun":"Have fun!","m_add_ones":"Add the ones.","m_add_tens":"Now add the tens. Remember the one you carried!","m_write":"Write","m_carry":"and carry the one to the tens.","w_add":"add","ws_add":"add","w_ones":"ones","ws_ones":"ones","w_tens":"tens","ws_tens":"tens","w_dough":"dough","ws_dough":"dough","w_nut":"nut","ws_nut":"nut","w_doughnut":"doughnut","ws_doughnut":"doughnut","w_pea":"pea","ws_pea":"pea","w_peanut":"peanut","ws_peanut":"peanut","w_blueberry":"blueberry","ws_blueberry":"blueberry","w_burger":"burger","ws_burger":"burger","w_hamburger":"hamburger","ws_hamburger":"hamburger","w_soft":"soft","ws_soft":"soft","w_softball":"softball","ws_softball":"softball","w_volley":"volley","ws_volley":"volley","w_volleyball":"volleyball","ws_volleyball":"volleyball","w_mark":"mark","ws_mark":"mark","w_bookmark":"bookmark","ws_bookmark":"bookmark","w_clip":"clip","ws_clip":"clip","w_clipboard":"clipboard","ws_clipboard":"clipboard","w_snowboard":"snowboard","ws_snowboard":"snowboard","w_row":"row","ws_row":"row","w_rowboat":"rowboat","ws_rowboat":"rowboat","w_speed":"speed","ws_speed":"speed","w_speedboat":"speedboat","ws_speedboat":"speedboat","w_rail":"rail","ws_rail":"rail","w_road":"road","ws_road":"road","w_railroad":"railroad","ws_railroad":"railroad","w_way":"way","ws_way":"way","w_highway":"highway","ws_highway":"highway","w_stoplight":"stoplight","ws_stoplight":"stoplight","w_rise":"rise","ws_rise":"rise","w_sunrise":"sunrise","ws_sunrise":"sunrise","w_plant":"plant","ws_plant":"plant","w_houseplant":"houseplant","ws_houseplant":"houseplant","w_spiderweb":"spiderweb","ws_spiderweb":"spiderweb","w_honeybee":"honeybee","ws_honeybee":"honeybee","w_hedge":"hedge","ws_hedge":"hedge","w_hog":"hog","ws_hog":"hog","w_hedgehog":"hedgehog","ws_hedgehog":"hedgehog","w_rein":"rein","ws_rein":"rein","w_deer":"deer","ws_deer":"deer","w_reindeer":"reindeer","ws_reindeer":"reindeer","w_print":"print","ws_print":"print","w_footprint":"footprint","ws_footprint":"footprint","w_shake":"shake","ws_shake":"shake","w_handshake":"handshake","ws_handshake":"handshake","w_phones":"phones","ws_phones":"phones","w_headphones":"headphones","ws_headphones":"headphones","w_neck":"neck","ws_neck":"neck","w_necktie":"necktie","ws_necktie":"necktie","w_suit":"suit","ws_suit":"suit","w_case":"case","ws_case":"case","w_suitcase":"suitcase","ws_suitcase":"suitcase","w_tool":"tool","ws_tool":"tool","w_toolbox":"toolbox","ws_toolbox":"toolbox","w_chop":"chop","ws_chop":"chop","w_sticks":"sticks","ws_sticks":"sticks","w_chopsticks":"chopsticks","ws_chopsticks":"chopsticks","w_lipstick":"lipstick","ws_lipstick":"lipstick","w_joy":"joy","ws_joy":"joy","w_joystick":"joystick","ws_joystick":"joystick","w_lap":"lap","ws_lap":"lap","w_laptop":"laptop","ws_laptop":"laptop","w_screw":"screw","ws_screw":"screw","w_driver":"driver","ws_driver":"driver","w_screwdriver":"screwdriver","ws_screwdriver":"screwdriver","w_wheel":"wheel","ws_wheel":"wheel","w_wheelchair":"wheelchair","ws_wheelchair":"wheelchair","w_cart":"cart","ws_cart":"cart","w_cartwheel":"cartwheel","ws_cartwheel":"cartwheel","w_super":"super","ws_super":"super","w_hero":"hero","ws_hero":"hero","w_superhero":"superhero","ws_superhero":"superhero","w_space":"space","ws_space":"space","w_spaceship":"spaceship","ws_spaceship":"spaceship","w_flash":"flash","ws_flash":"flash","w_flashlight":"flashlight","ws_flashlight":"flashlight","w_hour":"hour","ws_hour":"hour","w_glass":"glass","ws_glass":"glass","w_hourglass":"hourglass","ws_hourglass":"hourglass","w_watch":"watch","ws_watch":"watch","w_stopwatch":"stopwatch","ws_stopwatch":"stopwatch","w_wrist":"wrist","ws_wrist":"wrist","w_wristwatch":"wristwatch","ws_wristwatch":"wristwatch","w_bedtime":"bedtime","ws_bedtime":"bedtime","w_sunlight":"sunlight","ws_sunlight":"sunlight","w_sunburn":"sunburn","ws_sunburn":"sunburn","w_rainfall":"rainfall","ws_rainfall":"rainfall","w_snowfall":"snowfall","ws_snowfall":"snowfall","w_yard":"yard","ws_yard":"yard","w_backyard":"backyard","ws_backyard":"backyard","w_doorway":"doorway","ws_doorway":"doorway","w_doormat":"doormat","ws_doormat":"doormat","w_place":"place","ws_place":"place","w_fireplace":"fireplace","ws_fireplace":"fireplace","w_wood":"wood","ws_wood":"wood","w_firewood":"firewood","ws_firewood":"firewood","w_mailman":"mailman","ws_mailman":"mailman","w_playtime":"playtime","ws_playtime":"playtime","w_playmate":"playmate","ws_playmate":"playmate","w_daylight":"daylight","ws_daylight":"daylight","w_nighttime":"nighttime","ws_nighttime":"nighttime","w_bookcase":"bookcase","ws_bookcase":"bookcase","w_shelf":"shelf","ws_shelf":"shelf","w_bookshelf":"bookshelf","ws_bookshelf":"bookshelf","w_worm":"worm","ws_worm":"worm","w_bookworm":"bookworm","ws_bookworm":"bookworm","w_cowgirl":"cowgirl","ws_cowgirl":"cowgirl","w_catfish":"catfish","ws_catfish":"catfish","w_bean":"bean","ws_bean":"bean","w_jellybean":"jellybean","ws_jellybean":"jellybean","w_shore":"shore","ws_shore":"shore","w_seashore":"seashore","ws_seashore":"seashore","w_weed":"weed","ws_weed":"weed","w_seaweed":"seaweed","ws_seaweed":"seaweed","w_seahorse":"seahorse","ws_seahorse":"seahorse","w_teacup":"teacup","ws_teacup":"teacup","w_spoon":"spoon","ws_spoon":"spoon","w_teaspoon":"teaspoon","ws_teaspoon":"teaspoon","w_brow":"brow","ws_brow":"brow","w_eyebrow":"eyebrow","ws_eyebrow":"eyebrow","w_hairbrush":"hairbrush","ws_hairbrush":"hairbrush","w_toothpick":"toothpick","ws_toothpick":"toothpick","w_castle":"castle","ws_castle":"castle","w_sandcastle":"sandcastle","ws_sandcastle":"sandcastle","w_snowstorm":"snowstorm","ws_snowstorm":"snowstorm","w_treehouse":"treehouse","ws_treehouse":"treehouse","w_lighthouse":"lighthouse","ws_lighthouse":"lighthouse","w_doll":"doll","ws_doll":"doll","w_dollhouse":"dollhouse","ws_dollhouse":"dollhouse","w_bluebird":"bluebird","ws_bluebird":"bluebird","w_pigpen":"pigpen","ws_pigpen":"pigpen","w_pony":"pony","ws_pony":"pony","w_tail":"tail","ws_tail":"tail","w_ponytail":"ponytail","ws_ponytail":"ponytail","w_hilltop":"hilltop","ws_hilltop":"hilltop","w_treetop":"treetop","ws_treetop":"treetop","w_roof":"roof","ws_roof":"roof","w_rooftop":"rooftop","ws_rooftop":"rooftop","w_bull":"bull","ws_bull":"bull","w_bullfrog":"bullfrog","ws_bullfrog":"bullfrog","w_pinecone":"pinecone","ws_pinecone":"pinecone","w_pinwheel":"pinwheel","ws_pinwheel":"pinwheel","w_wind":"wind","ws_wind":"wind","w_mill":"mill","ws_mill":"mill","w_windmill":"windmill","ws_windmill":"windmill","w_hive":"hive","ws_hive":"hive","w_beehive":"beehive","ws_beehive":"beehive","w_anthill":"anthill","ws_anthill":"anthill","w_band":"band","ws_band":"band","w_headband":"headband","ws_headband":"headband","w_arm":"arm","ws_arm":"arm","w_armchair":"armchair","ws_armchair":"armchair","w_knob":"knob","ws_knob":"knob","w_doorknob":"doorknob","ws_doorknob":"doorknob","w_hole":"hole","ws_hole":"hole","w_keyhole":"keyhole","ws_keyhole":"keyhole","w_meatball":"meatball","ws_meatball":"meatball","w_eggshell":"eggshell","ws_eggshell":"eggshell","w_oat":"oat","ws_oat":"oat","w_meal":"meal","ws_meal":"meal","w_oatmeal":"oatmeal","ws_oatmeal":"oatmeal","w_field":"field","ws_field":"field","w_cornfield":"cornfield","ws_cornfield":"cornfield","w_barn":"barn","ws_barn":"barn","w_barnyard":"barnyard","ws_barnyard":"barnyard","w_hay":"hay","ws_hay":"hay","w_stack":"stack","ws_stack":"stack","w_haystack":"haystack","ws_haystack":"haystack","w_scare":"scare","ws_scare":"scare","w_crow":"crow","ws_crow":"crow","w_scarecrow":"scarecrow","ws_scarecrow":"scarecrow","w_screen":"screen","ws_screen":"screen","w_sunscreen":"sunscreen","ws_sunscreen":"sunscreen","w_pillow":"pillow","ws_pillow":"pillow","w_pillowcase":"pillowcase","ws_pillowcase":"pillowcase","w_birdbath":"birdbath","ws_birdbath":"birdbath","w_birdseed":"birdseed","ws_birdseed":"birdseed","w_lace":"lace","ws_lace":"lace","w_shoelace":"shoelace","ws_shoelace":"shoelace","w_shoebox":"shoebox","ws_shoebox":"shoebox","w_sandpaper":"sandpaper","ws_sandpaper":"sandpaper","w_side":"side","ws_side":"side","w_inside":"inside","ws_inside":"inside","w_outside":"outside","ws_outside":"outside","w_stairs":"stairs","ws_stairs":"stairs","w_upstairs":"upstairs","ws_upstairs":"upstairs","w_downstairs":"downstairs","ws_downstairs":"downstairs","w_gum":"gum","ws_gum":"gum","w_gumball":"gumball","ws_gumball":"gumball","w_buttercup":"buttercup","ws_buttercup":"buttercup","w_bowl":"bowl","ws_bowl":"bowl","w_fishbowl":"fishbowl","ws_fishbowl":"fishbowl","w_milkshake":"milkshake","ws_milkshake":"milkshake","w_cheesecake":"cheesecake","ws_cheesecake":"cheesecake","w_cook":"cook","ws_cook":"cook","w_cookbook":"cookbook","ws_cookbook":"cookbook","w_story":"story","ws_story":"story","w_storybook":"storybook","ws_storybook":"storybook","w_tug":"tug","ws_tug":"tug","w_tugboat":"tugboat","ws_tugboat":"tugboat","w_everybody":"everybody","ws_everybody":"everybody","w_everyone":"everyone","ws_everyone":"everyone","w_everywhere":"everywhere","ws_everywhere":"everywhere","w_something":"something","ws_something":"something","w_someone":"someone","ws_someone":"someone","w_sometimes":"sometimes","ws_sometimes":"sometimes","w_somewhere":"somewhere","ws_somewhere":"somewhere","w_anybody":"anybody","ws_anybody":"anybody","w_anywhere":"anywhere","ws_anywhere":"anywhere","w_waterfall":"waterfall","ws_waterfall":"waterfall","w_underwater":"underwater","ws_underwater":"underwater","w_underground":"underground","ws_underground":"underground","w_overnight":"overnight","ws_overnight":"overnight","w_rattle":"rattle","ws_rattle":"rattle","w_rattlesnake":"rattlesnake","ws_rattlesnake":"rattlesnake","w_dragonfly":"dragonfly","ws_dragonfly":"dragonfly","w_comb":"comb","ws_comb":"comb","w_honeycomb":"honeycomb","ws_honeycomb":"honeycomb","w_bumble":"bumble","ws_bumble":"bumble","w_bumblebee":"bumblebee","ws_bumblebee":"bumblebee","w_tumble":"tumble","ws_tumble":"tumble","w_tumbleweed":"tumbleweed","ws_tumbleweed":"tumbleweed","w_bolt":"bolt","ws_bolt":"bolt","w_thunderbolt":"thunderbolt","ws_thunderbolt":"thunderbolt","w_grape":"grape","ws_grape":"grape","w_fruit":"fruit","ws_fruit":"fruit","w_grapefruit":"grapefruit","ws_grapefruit":"grapefruit","w_ginger":"ginger","ws_ginger":"ginger","w_bread":"bread","ws_bread":"bread","w_gingerbread":"gingerbread","ws_gingerbread":"gingerbread","w_pepper":"pepper","ws_pepper":"pepper","w_mint":"mint","ws_mint":"mint","w_peppermint":"peppermint","ws_peppermint":"peppermint","w_cotton":"cotton","ws_cotton":"cotton","w_cottontail":"cottontail","ws_cottontail":"cottontail","w_pecker":"pecker","ws_pecker":"pecker","w_woodpecker":"woodpecker","ws_woodpecker":"woodpecker","w_humming":"humming","ws_humming":"humming","w_hummingbird":"hummingbird","ws_hummingbird":"hummingbird","w_mocking":"mocking","ws_mocking":"mocking","w_mockingbird":"mockingbird","ws_mockingbird":"mockingbird","w_blackberry":"blackberry","ws_blackberry":"blackberry","w_teller":"teller","ws_teller":"teller","w_storyteller":"storyteller","ws_storyteller":"storyteller","w_baby":"baby","ws_baby":"baby","w_sitter":"sitter","ws_sitter":"sitter","w_babysitter":"babysitter","ws_babysitter":"babysitter","w_surf":"surf","ws_surf":"surf","w_surfboard":"surfboard","ws_surfboard":"surfboard","w_cheer":"cheer","ws_cheer":"cheer","w_leader":"leader","ws_leader":"leader","w_cheerleader":"cheerleader","ws_cheerleader":"cheerleader","w_motorboat":"motorboat","ws_motorboat":"motorboat","w_rainwater":"rainwater","ws_rainwater":"rainwater","w_campground":"campground","ws_campground":"campground","w_background":"background","ws_background":"background","w_line":"line","ws_line":"line","w_underline":"underline","ws_underline":"underline","w_writing":"writing","ws_writing":"writing","w_handwriting":"handwriting","ws_handwriting":"handwriting","w_school":"school","ws_school":"school","w_schoolhouse":"schoolhouse","ws_schoolhouse":"schoolhouse","w_summertime":"summertime","ws_summertime":"summertime","w_wintertime":"wintertime","ws_wintertime":"wintertime","w_spring":"spring","ws_spring":"spring","w_springtime":"springtime","ws_springtime":"springtime","w_dinner":"dinner","ws_dinner":"dinner","w_dinnertime":"dinnertime","ws_dinnertime":"dinnertime","w_wild":"wild","ws_wild":"wild","w_wildflower":"wildflower","ws_wildflower":"wildflower","w_barrow":"barrow","ws_barrow":"barrow","w_wheelbarrow":"wheelbarrow","ws_wheelbarrow":"wheelbarrow","w_turtleneck":"turtleneck","ws_turtleneck":"turtleneck","w_sweat":"sweat","ws_sweat":"sweat","w_sweatshirt":"sweatshirt","ws_sweatshirt":"sweatshirt","w_fingerprint":"fingerprint","ws_fingerprint":"fingerprint","w_fingertip":"fingertip","ws_fingertip":"fingertip","w_earth":"earth","ws_earth":"earth","w_earthworm":"earthworm","ws_earthworm":"earthworm","w_candlelight":"candlelight","ws_candlelight":"candlelight","w_life":"life","ws_life":"life","w_guard":"guard","ws_guard":"guard","w_lifeguard":"lifeguard","ws_lifeguard":"lifeguard","w_goal":"goal","ws_goal":"goal","w_keeper":"keeper","ws_keeper":"keeper","w_goalkeeper":"goalkeeper","ws_goalkeeper":"goalkeeper","w_zookeeper":"zookeeper","ws_zookeeper":"zookeeper","w_beekeeper":"beekeeper","ws_beekeeper":"beekeeper","w_touchdown":"touchdown","ws_touchdown":"touchdown","w_break":"break","ws_break":"break","w_breakfast":"breakfast","ws_breakfast":"breakfast","w_cloth":"cloth","ws_cloth":"cloth","w_tablecloth":"tablecloth","ws_tablecloth":"tablecloth","w_tablespoon":"tablespoon","ws_tablespoon":"tablespoon","w_flowerpot":"flowerpot","ws_flowerpot":"flowerpot","w_parent":"parent","ws_parent":"parent","w_grandparent":"grandparent","ws_grandparent":"grandparent"};

function load(k, d){ try { var v = localStorage.getItem("speech:" + k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } }
function save(k, v){ try { localStorage.setItem("speech:" + k, JSON.stringify(v)); } catch(e){} }

var bridge = window.AndroidTTS || null;
var nativeAudio = window.AndroidAudio || null;   // the app plays clips natively (old WebViews can't)
/* volume level 0 (off) .. 6; 5 and 6 boost past the frame's maximum (see GameActivity) */
var MAX_LEVEL = 6, level = 5;
try { level = nativeAudio && nativeAudio.level ? nativeAudio.level() : load("level", 5); } catch(e){ level = 5; }
var clipToken = 0;
var browserTTS = !bridge && ("speechSynthesis" in window) ? window.speechSynthesis : null;
var clips = null;            // keys with recorded audio
var voices = [], voice = null;
var savedVoice = load("voice", "");
var listeners = [];
var queue = [], playing = null, rate = 1;

function notify(){ for (var i = 0; i < listeners.length; i++){ try { listeners[i](); } catch(e){} } }

/* The app's text-to-speech starts only if there are no recorded clips (see GameActivity.startTts). */
function clipsChecked(){
  if (!clips && bridge && bridge.enable){ try { bridge.enable(); } catch(e){} }
  notify();
}

/* recorded clips */
try {
  var x = new XMLHttpRequest();
  x.open("GET", "audio/index.json", true);
  x.onload = function(){
    if (x.status === 200){
      try { var arr = JSON.parse(x.responseText); clips = {}; for (var i = 0; i < arr.length; i++) clips[arr[i]] = true; } catch(e){ clips = null; }
    }
    clipsChecked();
  };
  x.onerror = clipsChecked;
  x.send();
} catch(e){}

/* text-to-speech voices */
function score(v){
  if (!/^en/i.test(v.lang || "")) return -1;
  var s = 100, n = v.name || "";
  if (/en[-_]US/i.test(v.lang)) s += 10;
  if (/natural|neural|enhanced|premium|google/i.test(n)) s += 50;
  if (v.localService === false) s += 5;
  return s;
}
function loadVoices(){
  var list = [];
  try {
    if (bridge) list = JSON.parse(bridge.voices());
    else if (browserTTS) list = browserTTS.getVoices().map(function(v){ return {id:v.name, name:v.name, lang:v.lang, localService:v.localService, raw:v}; });
  } catch(e){ list = []; }
  voices = list.filter(function(v){ return score(v) >= 0; }).sort(function(a, b){ return score(b) - score(a); });
  voice = null;
  for (var i = 0; i < voices.length; i++) if (voices[i].id === savedVoice) voice = voices[i];
  if (!voice && voices.length) voice = voices[0];
  notify();
}
window.__ttsReady = loadVoices;
if (browserTTS){ browserTTS.onvoiceschanged = loadVoices; setTimeout(loadVoices, 300); }


function mode(){
  if (clips) return "audio";
  if (voices.length) return "tts";
  return "none";
}

/* called once when the current say() finishes (not when it is interrupted) */
var doneCb = null;
function finished(){ var cb = doneCb; doneCb = null; if (cb) setTimeout(cb, 0); }

function stop(){
  queue = [];
  doneCb = null;
  clipToken++;
  if (nativeAudio){ try { nativeAudio.stop(); } catch(e){} }
  if (playing){ try { playing.onended = null; playing.onerror = null; playing.pause(); } catch(e){} playing = null; }
  try { if (bridge) bridge.cancel(); else if (browserTTS) browserTTS.cancel(); } catch(e){}
}

window.__clipDone = function(token){ if (token === clipToken) playNext(); };

function playNext(){
  if (!queue.length){ playing = null; finished(); return; }
  var item = queue.shift(), key = item.k, r = item.r;
  if (nativeAudio){
    clipToken++;
    try {
      if (r !== 1 && nativeAudio.playRate) nativeAudio.playRate(key, clipToken, r);
      else nativeAudio.play(key, clipToken);
    } catch(e){ playNext(); }
    return;
  }
  var a = new Audio("audio/" + key + ".mp3");
  playing = a;
  try { a.volume = Math.min(1, level / 4); a.playbackRate = r; } catch(e){}
  a.onended = playNext;
  a.onerror = playNext;
  try { var p = a.play(); if (p && p["catch"]) p["catch"](function(){ playNext(); }); } catch(e){ playNext(); }
}

function sayTTS(texts){
  try {
    if (bridge){
      for (var i = 0; i < texts.length; i++) bridge.speak(texts[i], voice ? voice.id : "", 0.9 * rate, 1.0, i === 0);
    } else if (browserTTS){
      browserTTS.cancel();
      texts.forEach(function(t){
        var u = new SpeechSynthesisUtterance(t);
        if (voice && voice.raw){ u.voice = voice.raw; u.lang = voice.raw.lang; } else u.lang = "en-US";
        u.rate = 0.9; u.pitch = 1.0; browserTTS.speak(u);
      });
    }
  } catch(e){}
}

/* keys: list of phrase keys, e.g. ["w_cat","p_praise_0"] */
/* keys: phrase keys to say in order; done (optional): called when all of them have been said;
   speed (optional): 1 normal, above 1 faster and squeakier, below 1 slower and deeper (silly voices) */
function say(keys, done, speed){
  if (level <= 0 || !keys || !keys.length){ if (done) setTimeout(done, 0); return; }
  stop();
  doneCb = done || null;
  rate = speed || 1;
  var m = mode();
  if (m === "audio"){
    var allRecorded = keys.every(function(k){ return clips[k]; });
    if (allRecorded || !voices.length){
      queue = keys.filter(function(k){ return clips[k]; }).map(function(k){ return { k:k, r:rate }; });
      if (slowOn && rate === 1) queue = queue.map(slowItem);
      playNext();
      return;
    }
  }
  if (voices.length){
    sayTTS(keys.map(function(k){ return PHRASES[k] || ""; }).filter(Boolean));
    setTimeout(function(){ if (doneCb === done) finished(); }, 900 * keys.length);  // TTS gives no end signal
  } else finished();
}

/* ---- tap any word to hear it ----
   Speech.tapText(text) returns HTML where each word is <span class="tw" data-say="key">.
   Words map to w_<word>, numbers 0-100 to n_<n>, and + - x / = to the math words.
   One click handler for the whole page plays the clip (silent if there's no clip). */
var OPS = { "+":"m_plus", "-":"m_minus", "\u2212":"m_minus", "\u00d7":"m_times", "\u00f7":"m_div", "=":"m_equals" };
function tokenKey(tok){
  var t = String(tok).replace(/^[^A-Za-z0-9'+=\u2212\u00d7\u00f7-]+|[^A-Za-z0-9'+=\u2212\u00d7\u00f7-]+$/g, "");
  if (!t) return "";
  if (OPS[t]) return OPS[t];
  if (/^[0-9]+$/.test(t)){ var num = parseInt(t, 10); return num <= 100 ? "n_" + num : ""; }
  if (/^[A-Za-z']+$/.test(t)) return "w_" + t.toLowerCase().replace(/[^a-z0-9]/g, "");
  return "";
}
function esc(s){ return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function tapText(text){
  return String(text).split(/(\s+)/).map(function(part){
    if (!part || /^\s+$/.test(part)) return part;
    var k = tokenKey(part);
    return k ? '<span class="tw" data-say="' + k + '">' + esc(part) + '</span>' : esc(part);
  }).join("");
}
document.addEventListener("click", function(e){
  var t = e.target;
  while (t && t !== document && t.getAttribute){
    var k = t.getAttribute("data-say");
    if (k){
      say([k]);
      var shown = t;
      shown.className += " tw-on";
      setTimeout(function(){ shown.className = shown.className.replace(/\s*tw-on/g, ""); }, 600);
      return;
    }
    t = t.parentNode;
  }
}, false);
(function(){
  var st = document.createElement("style");
  st.textContent = ".tw{cursor:pointer;border-radius:.8vmin;-webkit-transition:background .15s;transition:background .15s}" +
    ".tw-on{background:rgba(255,217,61,.45)}";
  (document.head || document.documentElement).appendChild(st);
})();

/* ---- volume control: speaker, -, six bars, + ; fixed bottom-left on pickers and level lists ---- */
function setLevel(n){
  n = Math.max(0, Math.min(MAX_LEVEL, n));
  level = n;
  try { if (nativeAudio && nativeAudio.setLevel) nativeAudio.setLevel(n); } catch(e){}
  save("level", n);
  drawVolume();
  if (n > 0) say(["p_praise_0"]); else stop();
  notify();
}
var volBox = null;
function drawVolume(){
  if (!volBox) return;
  volBox.querySelector(".volicon").src = "emoji/" + (level === 0 ? "1f507" : level < 4 ? "1f508" : "1f50a") + ".svg";
  var bars = volBox.querySelectorAll(".volbar");
  for (var i = 0; i < bars.length; i++) bars[i].className = "volbar" + (i < level ? " on" : "") + (i >= 4 ? " boost" : "");
}
(function(){
  var st = document.createElement("style");
  st.textContent =
    /* top-right corner, level with the Back button; hidden during play */
    ".volbox{position:fixed;right:3vmin;top:4vmin;z-index:30;height:8vmin;padding:0 .8vmin;display:-webkit-flex;display:flex;" +
    "-webkit-align-items:center;align-items:center;background:#F7F9FF;border:0.5vmin solid #1F2A44;border-radius:4vmin;box-shadow:0.6vmin 0.6vmin 0 #05081A}" +
    "body[data-screen]:not([data-screen=home]) .volbox{display:none}" +
    ".volicon{width:4.8vmin;height:4.8vmin;margin:0 .8vmin 0 .6vmin}" +
    ".volb{width:6vmin;height:6vmin;border-radius:50%;border:0.4vmin solid #1F2A44;background:#FFD93D;color:#1F2A44;" +
    "font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:4.4vmin;line-height:1;padding:0;cursor:pointer;outline:none;text-align:center;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}" +
    ".volb:active{background:#FFC000}" +
    ".volbars{display:-webkit-flex;display:flex;-webkit-align-items:flex-end;align-items:flex-end;height:5.6vmin;margin:0 1vmin}" +
    ".volbar{width:2.6vmin;margin:0 .35vmin;border-radius:.6vmin;background:#D5DBEA;cursor:pointer}" +
    ".volbar.on{background:#3FB37F}.volbar.boost.on{background:#FF8A3D}" +
    /* the top row of pickers and level lists leaves room for it on the right */
    "body:not([data-screen]) .backroom,body[data-screen=home] .backroom{padding-right:40vmin}" +
    ".backroom > div{min-width:0;-webkit-flex:1;flex:1}";
  (document.head || document.documentElement).appendChild(st);
  volBox = document.createElement("div");
  volBox.className = "volbox";
  var bars = "";
  for (var i = 0; i < MAX_LEVEL; i++) bars += '<span class="volbar" data-level="' + (i + 1) + '" style="height:' + (1.6 + i*0.8) + 'vmin"></span>';
  volBox.innerHTML = '<img class="volicon" alt="">' +
    '<button class="volb" data-step="-1" aria-label="Quieter">&#8722;</button><span class="volbars">' + bars + '</span>' +
    '<button class="volb" data-step="1" aria-label="Louder">+</button>';
  volBox.onclick = function(e){
    var t = e.target, step = t.getAttribute("data-step"), lv = t.getAttribute("data-level");
    if (step) setLevel(level + parseInt(step, 10));
    else if (lv) setLevel(parseInt(lv, 10) === level ? level - 1 : parseInt(lv, 10));
  };
  document.body.appendChild(volBox);
  drawVolume();
})();

/* ---- turtle: an on/off toggle that says words slowly ----
   While it's on, every single word (w_ keys) is said slowly: its own slow recording (ws_<word>,
   recorded slower so it stays clear), or until that exists the normal clip at 0.7x. Instructions,
   sentences, praise and silly voices are never slowed. Remembered between games. */
var slowOn = load("slow", false);
function slowItem(it){
  if (!/^w_/.test(it.k)) return it;
  var ws = it.k.replace(/^w_/, "ws_");
  return clips && clips[ws] ? { k:ws, r:1 } : { k:it.k, r:0.7 };
}
var turtles = [];
function drawTurtles(){
  turtles = turtles.filter(function(b){ return document.body.contains(b); });
  turtles.forEach(function(b){ b.className = "turtle" + (slowOn ? " on" : ""); b.setAttribute("aria-pressed", slowOn ? "true" : "false"); });
}
function setSlow(on){ slowOn = !!on; save("slow", slowOn); drawTurtles(); }
function turtleButton(key){
  var b = document.createElement("button");
  b.setAttribute("aria-label", "Slow words");
  b.innerHTML = '<img src="emoji/1f422.svg" alt=""><span>Slow</span>';
  b.onclick = function(e){
    if (e && e.stopPropagation) e.stopPropagation();
    setSlow(!slowOn);
    if (key) say([key]);   // say the word at the new speed so she hears the difference
  };
  turtles.push(b);
  b.className = "turtle" + (slowOn ? " on" : "");
  return b;
}
(function(){
  var st = document.createElement("style");
  st.textContent = ".turtle{height:9vmin;margin:0 0 0 1.4vmin;padding:0 2.2vmin 0 1.4vmin;border-radius:4.5vmin;background:#F7F9FF;" +
    "border:0.5vmin solid #1F2A44;box-shadow:0.6vmin 0.6vmin 0 #05081A;cursor:pointer;outline:none;display:-webkit-inline-flex;display:inline-flex;" +
    "-webkit-align-items:center;align-items:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:3.4vmin;color:#4F5F80;vertical-align:middle}" +
    ".turtle img{width:6vmin;height:6vmin;margin-right:1vmin;display:block;opacity:.55}" +
    ".turtle.on{background:#7CFFB2;color:#14193A;border-color:#14193A}.turtle.on img{opacity:1}";
  (document.head || document.documentElement).appendChild(st);
})();

/* ---- turn timer: a few minutes each, then "Switch turns!" (so her brother gets turns too) ----
   The countdown runs in the app (AndroidApp.turnStart/turnLeft/turnStop, TurnTimer.kt), so it keeps
   going from page to page and over the photos (it opens the game to say "switch turns"). In a plain
   browser it's kept in localStorage. While it runs, every page shows a small countdown: in play
   under the stars (top right), on pickers and level lists just left of the volume control (the
   top row makes room); when it runs out, a popup on whatever page is open says "Switch turns!".
   The "Pick a mission" page has the start button (#turnbar) with - and + to pick the minutes
   (remembered as speech:turnMin). */
var TURN_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30];
function turnMin(){ var m = load("turnMin", 5); return TURN_CHOICES.indexOf(m) >= 0 ? m : 5; }
function stepTurnMin(dir){
  var i = TURN_CHOICES.indexOf(turnMin()) + dir;
  save("turnMin", TURN_CHOICES[Math.max(0, Math.min(TURN_CHOICES.length - 1, i))]);
  turnBarState = ""; turnTick();
}
var turnApp = window.AndroidApp && window.AndroidApp.turnLeft ? window.AndroidApp : null;
var turnPill = null, turnPop = null, turnBar = null, turnShown = false, turnBarState = "";
function turnLeft(){
  if (turnApp){ try { return Number(turnApp.turnLeft()) || 0; } catch(e){ return 0; } }
  var end = load("turnEnd", 0);
  if (!end) return 0;
  if (end < 0) return -1;
  if (end - Date.now() <= 0){ save("turnEnd", -1); return -1; }
  return end - Date.now();
}
function turnStart(){
  var m = turnMin(), ms = m * 60 * 1000;
  if (turnApp){ try { turnApp.turnStart(ms); } catch(e){} } else save("turnEnd", Date.now() + ms);
  turnTick();
  say(["p_your_turn", "n_" + m, m === 1 ? "p_minute" : "p_minutes", "p_have_fun"]);
}
function turnStop(){
  if (turnApp){ try { turnApp.turnStop(); } catch(e){} } else save("turnEnd", 0);
  turnTick();
}
function clock(ms){ var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
function drawTurnBar(left){
  if (!turnBar) return;
  var state = left > 0 ? "run" : "idle";
  if (state === turnBarState){ if (left > 0) turnBar.querySelector(".turnleft").innerHTML = clock(left) + " left"; return; }
  turnBarState = state;
  if (state === "idle"){
    var m = turnMin();
    turnBar.innerHTML = '<span class="turnpick"><button class="turnstep" data-dir="-1" aria-label="Fewer minutes">&#8722;</button>' +
      '<span class="turnmin">' + m + ' min</span><button class="turnstep" data-dir="1" aria-label="More minutes">+</button></span>' +
      '<button class="turngo"><img src="emoji/23f1.svg" alt="">Start a ' + m + '-minute turn</button>';
    turnBar.querySelector(".turngo").onclick = turnStart;
    var steps = turnBar.querySelectorAll(".turnstep");
    for (var i = 0; i < steps.length; i++) steps[i].onclick = function(){ stepTurnMin(parseInt(this.getAttribute("data-dir"), 10)); };
  } else {
    turnBar.innerHTML = '<span class="turnrun"><img src="emoji/23f3.svg" alt=""><span class="turnleft">' + clock(left) + ' left</span></span>' +
      '<button class="turnstop">Stop timer</button>';
    turnBar.querySelector(".turnstop").onclick = turnStop;
  }
}
function turnTick(){
  var left = turnLeft();
  if (turnPill){
    var on = left > 0 && !turnBar;
    turnPill.style.display = on ? "" : "none";
    if (/\bturnon\b/.test(document.body.className) !== on) document.body.className = on ? (document.body.className + " turnon").replace(/^ /, "") : document.body.className.replace(/\s*\bturnon\b/g, "");
    if (on){
      turnPill.querySelector("span").innerHTML = clock(left);
      var byVol = volBox && volBox.offsetWidth > 0, r = byVol ? volBox.getBoundingClientRect() : null;
      turnPill.className = "turnpill" + (left <= 60000 ? " soon" : "") + (byVol ? " byvol" : "");
      turnPill.style.right = byVol ? Math.round(window.innerWidth - r.left + r.height * 0.25) + "px" : "";
      turnPill.style.top = byVol ? Math.round(r.top + (r.height - turnPill.offsetHeight) / 2) + "px" : "";
    }
  }
  drawTurnBar(left);
  if (left === -1 && !turnShown){
    turnShown = true; turnPop.style.display = "";
    say(["p_switch_turns"]);
  } else if (left !== -1 && turnShown){
    turnShown = false; turnPop.style.display = "none";
  }
}
(function(){
  var st = document.createElement("style");
  st.textContent =
    ".turnpill{position:fixed;right:3vmin;top:11.1vmin;z-index:30;height:4.9vmin;padding:0 1.5vmin 0 .8vmin;border-radius:2.5vmin;background:#14193A;" +
    "border:0.45vmin solid #5CE1E6;color:#F3F6FF;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;pointer-events:none;" +
    "font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600;font-size:3vmin;box-shadow:0.5vmin 0.5vmin 0 #05081A}" +
    ".turnpill img{width:3.6vmin;height:3.6vmin;margin-right:.7vmin}" +
    ".turnpill.byvol{height:7vmin;font-size:4vmin;border-radius:3.5vmin}.turnpill.byvol img{width:5vmin;height:5vmin}" +
    /* beside the volume control, the top row leaves room for both */
    "body.turnon:not([data-screen]) .backroom,body.turnon[data-screen=home] .backroom{padding-right:67vmin}" +
    ".turnpill.soon{border-color:#FFD93D;color:#FFD93D}" +
    ".turnpop{position:fixed;left:0;top:0;right:0;bottom:0;z-index:100;background:rgba(5,8,26,.88);display:-webkit-flex;display:flex;" +
    "-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif;font-weight:600}" +
    ".turncard{background:#1B2457;border:0.8vmin solid #FFD93D;border-radius:4vmin;box-shadow:1.2vmin 1.2vmin 0 #05081A;padding:5vmin 8vmin;text-align:center;color:#F3F6FF}" +
    ".turncard .turnicon{display:block;margin:0 auto;width:22vmin;height:22vmin;-webkit-animation:turnwob 1.2s ease-in-out infinite;animation:turnwob 1.2s ease-in-out infinite}" +
    "@-webkit-keyframes turnwob{0%,100%{-webkit-transform:rotate(-12deg)}50%{-webkit-transform:rotate(12deg)}}" +
    "@keyframes turnwob{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}" +
    ".turncard h2{margin:2vmin 0 1vmin;font-size:11vmin;line-height:1;color:#FFD93D;font-weight:600;text-shadow:0.6vmin 0.6vmin 0 #05081A}" +
    ".turncard p{margin:0 0 4vmin;font-size:4.4vmin;opacity:.9}" +
    ".turnbtns{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center}" +
    ".turnbtns button,.turnbar button{font-family:inherit;font-weight:600;cursor:pointer;outline:none;border:0.5vmin solid #1F2A44;border-radius:6vmin;" +
    "box-shadow:0.7vmin 0.7vmin 0 #05081A;color:#1F2A44;display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center}" +
    ".turnbtns button{font-size:5vmin;padding:2vmin 4.4vmin;margin:0 1.6vmin;background:#F7F9FF}" +
    ".turnbtns .turnnext{background:#FFD93D}" +
    ".turnbtns img,.turnbar img{width:6vmin;height:6vmin;margin-right:1.4vmin}" +
    ".turnbtns button:active,.turnbar button:active{-webkit-transform:translate(0.5vmin,0.5vmin);transform:translate(0.5vmin,0.5vmin);box-shadow:0.2vmin 0.2vmin 0 #05081A}" +
    ".turnbar{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center;-webkit-align-items:center;align-items:center;font-family:\"WHFun\",\"Trebuchet MS\",sans-serif}" +
    ".turnbar button{font-size:4.4vmin;padding:1.4vmin 3.6vmin;background:#F7F9FF}" +
    ".turnbar .turngo{background:#FFD93D}" +
    ".turnpick{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-right:3vmin;background:#F7F9FF;" +
    "border:0.5vmin solid #1F2A44;border-radius:6vmin;box-shadow:0.7vmin 0.7vmin 0 #05081A;padding:.8vmin;color:#1F2A44}" +
    ".turnbar .turnstep{width:7vmin;height:7vmin;padding:0;border-radius:50%;background:#FFD93D;font-size:5vmin;line-height:1;box-shadow:none;" +
    "border-width:0.4vmin;-webkit-justify-content:center;justify-content:center}" +
    ".turnmin{font-size:4.4vmin;min-width:15vmin;text-align:center}" +
    ".turnrun{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;font-size:5vmin;color:#FFD93D;margin-right:3vmin}" +
    ".turnrun img{width:7vmin;height:7vmin}";
  (document.head || document.documentElement).appendChild(st);
  turnPill = document.createElement("div");
  turnPill.className = "turnpill"; turnPill.style.display = "none";
  turnPill.innerHTML = '<img src="emoji/23f3.svg" alt=""><span></span>';
  document.body.appendChild(turnPill);
  turnPop = document.createElement("div");
  turnPop.className = "turnpop"; turnPop.style.display = "none";
  turnPop.innerHTML = '<div class="turncard"><img class="turnicon" src="emoji/23f3.svg" alt=""><h2>Switch turns!</h2><p>Time\'s up. Pass it to the next player.</p>' +
    '<div class="turnbtns"><button class="turnnext"><img src="emoji/1f504.svg" alt="">Next turn</button><button class="turndone">All done</button></div></div>';
  turnPop.querySelector(".turnnext").onclick = turnStart;
  turnPop.querySelector(".turndone").onclick = function(){ stop(); turnStop(); };
  document.body.appendChild(turnPop);
  function findBar(){ if (!turnBar){ turnBar = document.getElementById("turnbar"); turnBarState = ""; } turnTick(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", findBar, false); else findBar();
  setInterval(turnTick, 1000);
  // move the countdown as soon as the screen changes (pages set body[data-screen] in show())
  if (window.MutationObserver) new MutationObserver(turnTick).observe(document.body, { attributes:true, attributeFilter:["data-screen"] });
})();
/* the frame's Back key: while the popup is up it closes it (same as "All done") */
window.Turns = {
  start: turnStart,
  stop: turnStop,
  left: turnLeft,
  back: function(){ if (!turnShown) return false; stop(); turnStop(); return true; }
};

window.Speech = {
  turtleButton: turtleButton,
  slowOn: function(){ return slowOn; },
  setSlow: setSlow,
  tapText: tapText,
  tokenKey: tokenKey,
  say: say,
  stop: stop,
  mode: mode,
  canTalk: function(){ return level > 0 && mode() !== "none"; },
  soundOn: function(){ return level > 0; },
  level: function(){ return level; },
  setLevel: setLevel,
  voices: function(){ return voices; },
  voice: function(){ return voice; },
  setVoice: function(id){ for (var i = 0; i < voices.length; i++) if (voices[i].id === id) voice = voices[i]; savedVoice = id; save("voice", id); },
  onChange: function(fn){ listeners.push(fn); },
  key: function(word){ return "w_" + String(word).toLowerCase().replace(/[^a-z0-9]/g, ""); }
};
})();
